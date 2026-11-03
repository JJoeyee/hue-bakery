import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { addresses } from "../../../db/schema";
import { getCustomer } from "../../../lib/auth";
import { formatMalaysiaPhone, isValidMalaysiaPhone, MALAYSIAN_STATES } from "../../../lib/validation";
import { rejectCrossOriginRequest, rejectOversizedBody } from "../../../lib/security";

export async function GET() {
  const user = await getCustomer();
  if (!user) return Response.json({ error: "Please sign in first." }, { status: 401 });
  if (user.role === "admin") return Response.json({ error: "Customer address features are not available for administrator accounts." }, { status: 403 });
  const rows = await getDb().select().from(addresses).where(eq(addresses.userId, user.id)).orderBy(asc(addresses.createdAt));
  return Response.json({ addresses: rows });
}

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const sizeError = rejectOversizedBody(request, 16 * 1024);
  if (sizeError) return sizeError;
  const user = await getCustomer();
  if (!user) return Response.json({ error: "Please sign in first." }, { status: 401 });
  if (user.role === "admin") return Response.json({ error: "Customer address features are not available for administrator accounts." }, { status: 403 });
  const payload = await request.json() as Record<string, string | undefined>;
  const required = ["label", "recipientName", "phone", "line1", "city", "state", "postcode"];
  if (required.some((field) => !payload[field]?.trim()) || (payload.label?.trim().length ?? 0) > 40 || (payload.recipientName?.trim().length ?? 0) > 100 || (payload.line1?.trim().length ?? 0) > 180 || (payload.line2?.trim().length ?? 0) > 180 || (payload.city?.trim().length ?? 0) > 80 || (payload.postcode?.trim().length ?? 0) !== 5 || !/^\d{5}$/.test(payload.postcode?.trim() ?? "") || !MALAYSIAN_STATES.includes(payload.state!.trim() as typeof MALAYSIAN_STATES[number])) return Response.json({ error: "Please complete every address field with valid Malaysian details." }, { status: 400 });
  const db = getDb();
  const existing = await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, user.id));
  if (existing.length >= 5) return Response.json({ error: "You can save a maximum of 5 addresses." }, { status: 400 });
  const phone = formatMalaysiaPhone(payload.phone!.trim());
  if (!isValidMalaysiaPhone(phone)) return Response.json({ error: "Use a valid Malaysia phone number such as +6012-7778383." }, { status: 400 });
  const address = { id: crypto.randomUUID(), userId: user.id, label: payload.label!.trim(), recipientName: payload.recipientName!.trim(), phone, line1: payload.line1!.trim(), line2: payload.line2?.trim() ?? "", city: payload.city!.trim(), state: payload.state!.trim(), postcode: payload.postcode!.trim() };
  await db.insert(addresses).values(address);
  const savedAddresses = await db.select().from(addresses).where(eq(addresses.userId, user.id)).orderBy(asc(addresses.createdAt));
  return Response.json({ address, addresses: savedAddresses }, { status: 201 });
}

export async function DELETE(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const user = await getCustomer();
  if (!user) return Response.json({ error: "Please sign in first." }, { status: 401 });
  if (user.role === "admin") return Response.json({ error: "Customer address features are not available for administrator accounts." }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Address id is required." }, { status: 400 });
  await getDb().delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));
  const savedAddresses = await getDb().select().from(addresses).where(eq(addresses.userId, user.id)).orderBy(asc(addresses.createdAt));
  return Response.json({ ok: true, addresses: savedAddresses });
}
