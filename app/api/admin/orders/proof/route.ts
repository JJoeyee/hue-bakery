import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../../../db";
import { orders } from "../../../../../db/schema";
import { isAdmin } from "../../../../../lib/auth";

export async function GET(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Administrator access required." }, { status: 403 });
  const orderNumber = new URL(request.url).searchParams.get("orderNumber")?.trim() ?? "";
  if (!orderNumber || orderNumber.length > 60) return Response.json({ error: "Order number is required." }, { status: 400 });
  if (!env.BUCKET) return Response.json({ error: "Payment proof storage is not configured." }, { status: 503 });

  const [order] = await getDb().select({ paymentProofKey: orders.paymentProofKey }).from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  if (!order?.paymentProofKey) return Response.json({ error: "No payment proof has been uploaded for this order." }, { status: 404 });
  const object = await env.BUCKET.get(order.paymentProofKey);
  if (!object) return Response.json({ error: "The payment proof is no longer available." }, { status: 404 });

  const contentType = object.httpMetadata?.contentType?.startsWith("image/") ? object.httpMetadata.contentType : "application/octet-stream";
  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
