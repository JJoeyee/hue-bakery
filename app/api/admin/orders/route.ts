import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { addresses, orderItems, orders, users } from "../../../../db/schema";
import { isAdmin } from "../../../../lib/auth";
import { rejectCrossOriginRequest, rejectOversizedBody } from "../../../../lib/security";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Administrator access required." }, { status: 403 });
  const rows = await getDb().select({ order: orders, customer: users, address: addresses }).from(orders).innerJoin(users, eq(users.id, orders.userId)).innerJoin(addresses, eq(addresses.id, orders.addressId)).orderBy(desc(orders.createdAt));
  const result = await Promise.all(rows.map(async (row) => ({
    ...row,
    items: await getDb().select().from(orderItems).where(eq(orderItems.orderId, row.order.id)),
    customerNote: row.order.customerNote,
    paymentProofAvailable: Boolean(row.order.paymentProofKey),
  })));
  return Response.json({ orders: result });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Administrator access required." }, { status: 403 });
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const sizeError = rejectOversizedBody(request, 8 * 1024);
  if (sizeError) return sizeError;
  const payload = await request.json() as { id?: string; status?: string; paymentStatus?: string };
  if (!payload.id) return Response.json({ error: "Order id is required." }, { status: 400 });
  const statuses = ["pending", "preparing", "out_for_delivery", "completed", "cancelled"];
  const paymentStatuses = ["awaiting_proof", "proof_submitted", "paid", "rejected"];
  if (payload.status !== undefined && !statuses.includes(payload.status) || payload.paymentStatus !== undefined && !paymentStatuses.includes(payload.paymentStatus)) return Response.json({ error: "The order status is invalid." }, { status: 400 });
  await getDb().update(orders).set({ ...(payload.status ? { status: payload.status } : {}), ...(payload.paymentStatus ? { paymentStatus: payload.paymentStatus } : {}) }).where(eq(orders.id, payload.id));
  return Response.json({ ok: true });
}
