import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { addresses, orderItems, orders, products } from "../../../db/schema";
import { ensureStarterProducts } from "../../../lib/catalog";
import { getCustomer } from "../../../lib/auth";
import { rejectCrossOriginRequest, rejectOversizedBody } from "../../../lib/security";

function createOrderNumber() {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `HB-${day}-${suffix}`;
}

export async function GET() {
  const user = await getCustomer();
  if (!user) return Response.json({ error: "Please sign in first." }, { status: 401 });
  if (user.role === "admin") return Response.json({ error: "Customer ordering features are not available for administrator accounts." }, { status: 403 });
  const db = getDb();
  const customerOrders = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt));
  const result = await Promise.all(customerOrders.map(async (order) => ({ ...order, items: await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)) })));
  return Response.json({ orders: result });
}

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const sizeError = rejectOversizedBody(request, 32 * 1024);
  if (sizeError) return sizeError;
  const user = await getCustomer();
  if (!user) return Response.json({ error: "Please sign in before checkout." }, { status: 401 });
  if (user.role === "admin") return Response.json({ error: "Customer ordering features are not available for administrator accounts." }, { status: 403 });
  const payload = await request.json() as { items?: Array<{ productId?: string; quantity?: number }>; addressId?: string; deliveryDate?: string; deliveryWindow?: string; note?: string };
  if (!payload.items?.length || !payload.addressId || !payload.deliveryDate || !payload.deliveryWindow) return Response.json({ error: "Please choose at least one product, an address and a delivery schedule." }, { status: 400 });
  const items = payload.items.map((item) => ({ productId: item.productId ?? "", quantity: Math.floor(Number(item.quantity)) })).filter((item) => item.productId && item.quantity > 0 && item.quantity <= 20);
  if (!items.length) return Response.json({ error: "Your basket is empty." }, { status: 400 });
  try {
    await ensureStarterProducts();
    const db = getDb();
    const [address] = await db.select({ id: addresses.id }).from(addresses).where(and(eq(addresses.id, payload.addressId), eq(addresses.userId, user.id))).limit(1);
    if (!address) return Response.json({ error: "Please choose one of your saved addresses." }, { status: 400 });
    const ids = items.map((item) => item.productId);
    const productRows = await db.select().from(products).where(inArray(products.id, ids));
    const byId = new Map(productRows.map((product) => [product.id, product]));
    const lineItems = items.map((item) => ({ item, product: byId.get(item.productId) })).filter((entry) => entry.product && entry.product.status === "in_stock") as Array<{ item: { productId: string; quantity: number }; product: typeof productRows[number] }>;
    if (lineItems.length !== items.length) return Response.json({ error: "One of the products is no longer in stock. Please review your basket." }, { status: 409 });
    const subtotalCents = lineItems.reduce((sum, entry) => sum + entry.product.priceCents * entry.item.quantity, 0);
    const orderId = crypto.randomUUID();
    const orderNumber = createOrderNumber();
    await db.batch([
      db.insert(orders).values({ id: orderId, orderNumber, userId: user.id, addressId: payload.addressId, deliveryDate: payload.deliveryDate, deliveryWindow: payload.deliveryWindow, subtotalCents, totalCents: subtotalCents, customerNote: payload.note?.trim() ?? "" }),
      ...lineItems.map(({ item, product }) => db.insert(orderItems).values({ id: crypto.randomUUID(), orderId, productId: product.id, productName: product.name, unitPriceCents: product.priceCents, quantity: item.quantity })),
    ]);
    return Response.json({ ok: true, orderNumber, totalCents: subtotalCents }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create order." }, { status: 500 });
  }
}
