import { and, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../db";
import { orders } from "../../../db/schema";
import { getCustomer } from "../../../lib/auth";
import { rejectCrossOriginRequest, rejectOversizedBody } from "../../../lib/security";

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const sizeError = rejectOversizedBody(request, 8 * 1024 * 1024);
  if (sizeError) return sizeError;
  const user = await getCustomer();
  if (!user) return Response.json({ error: "Please sign in first." }, { status: 401 });
  if (user.role === "admin") return Response.json({ error: "Payment proof upload is available for customer accounts only." }, { status: 403 });
  const form = await request.formData();
  const orderNumber = String(form.get("orderNumber") ?? "").trim();
  const file = form.get("proof");
  if (!/^HB-\d{8}-[A-Z0-9]{5}$/.test(orderNumber) || !(file instanceof File)) return Response.json({ error: "Order number and payment screenshot are required." }, { status: 400 });
  if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) return Response.json({ error: "Please upload an image smaller than 8MB." }, { status: 400 });
  if (!env.BUCKET) return Response.json({ error: "Payment proof storage is not configured yet." }, { status: 503 });
  const [order] = await getDb().select({ id: orders.id }).from(orders).where(and(eq(orders.orderNumber, orderNumber), eq(orders.userId, user.id))).limit(1);
  if (!order) return Response.json({ error: "This order does not belong to your account." }, { status: 404 });
  const key = `payment-proofs/${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  await getDb().update(orders).set({ paymentProofKey: key, paymentStatus: "proof_submitted" }).where(eq(orders.id, order.id));
  return Response.json({ ok: true, message: "Payment proof submitted. Hue Bakery will confirm your order." });
}
