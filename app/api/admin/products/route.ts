import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { products } from "../../../../db/schema";
import { ensureStarterProducts } from "../../../../lib/catalog";
import { isAdmin } from "../../../../lib/auth";
import { rejectCrossOriginRequest, rejectOversizedBody } from "../../../../lib/security";

async function guard() {
  return Boolean(await isAdmin());
}

export async function GET() {
  if (!(await guard())) return Response.json({ error: "Administrator access required." }, { status: 403 });
  await ensureStarterProducts();
  return Response.json({ products: await getDb().select().from(products).orderBy(asc(products.createdAt)) });
}

export async function POST(request: Request) {
  if (!(await guard())) return Response.json({ error: "Administrator access required." }, { status: 403 });
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const sizeError = rejectOversizedBody(request, 16 * 1024);
  if (sizeError) return sizeError;
  const payload = await request.json() as { name?: string; description?: string; priceCents?: number; imageUrl?: string; status?: string };
  if (!payload.name?.trim() || payload.name.trim().length > 120 || (payload.description?.length ?? 0) > 1000 || !Number.isFinite(Number(payload.priceCents)) || Number(payload.priceCents) < 0 || Number(payload.priceCents) > 1000000) return Response.json({ error: "Please provide a valid product name, description and price." }, { status: 400 });
  const product = { id: crypto.randomUUID(), name: payload.name.trim(), description: payload.description?.trim() ?? "", priceCents: Math.max(0, Math.round(Number(payload.priceCents))), imageUrl: payload.imageUrl?.trim() || "/bakery-hero.png", status: payload.status === "out_of_stock" ? "out_of_stock" : "in_stock" };
  await getDb().insert(products).values(product);
  return Response.json({ product }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await guard())) return Response.json({ error: "Administrator access required." }, { status: 403 });
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const sizeError = rejectOversizedBody(request, 16 * 1024);
  if (sizeError) return sizeError;
  const payload = await request.json() as { id?: string; name?: string; description?: string; priceCents?: number; imageUrl?: string; status?: string };
  if (!payload.id) return Response.json({ error: "Product id is required." }, { status: 400 });
  if (payload.name !== undefined && (!payload.name.trim() || payload.name.trim().length > 120) || payload.description !== undefined && payload.description.length > 1000 || payload.priceCents !== undefined && (!Number.isFinite(Number(payload.priceCents)) || Number(payload.priceCents) < 0 || Number(payload.priceCents) > 1000000)) return Response.json({ error: "The product details are invalid." }, { status: 400 });
  await getDb().update(products).set({ ...(payload.name !== undefined ? { name: payload.name.trim() } : {}), ...(payload.description !== undefined ? { description: payload.description.trim() } : {}), ...(payload.priceCents !== undefined ? { priceCents: Math.max(0, Math.round(Number(payload.priceCents))) } : {}), ...(payload.imageUrl !== undefined ? { imageUrl: payload.imageUrl.trim() } : {}), ...(payload.status !== undefined ? { status: payload.status === "out_of_stock" ? "out_of_stock" : "in_stock" } : {}), updatedAt: new Date().toISOString() }).where(eq(products.id, payload.id));
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await guard())) return Response.json({ error: "Administrator access required." }, { status: 403 });
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Product id is required." }, { status: 400 });
  await getDb().delete(products).where(eq(products.id, id));
  return Response.json({ ok: true });
}
