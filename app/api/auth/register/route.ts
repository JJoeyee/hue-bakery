import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { createCustomerSession, hashPassword } from "../../../../lib/auth";
import { formatMalaysiaPhone, isValidMalaysiaPhone } from "../../../../lib/validation";
import { consumeRateLimit, rejectCrossOriginRequest, rejectOversizedBody, rateLimitResponse } from "../../../../lib/security";

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const sizeError = rejectOversizedBody(request, 16 * 1024);
  if (sizeError) return sizeError;
  if (!consumeRateLimit(request, "register", 5, 15 * 60_000)) return rateLimitResponse();
  const payload = await request.json() as Record<string, string | undefined>;
  const name = payload.name?.trim() ?? "";
  const phone = formatMalaysiaPhone(payload.phone?.trim() ?? "");
  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = payload.password ?? "";
  if (!name || name.length > 100 || !isValidMalaysiaPhone(phone) || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || password.length < 8 || password.length > 128 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) return Response.json({ error: "Please provide valid details and a password with uppercase, lowercase and number." }, { status: 400 });
  try {
    const db = getDb();
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing) return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    const userId = crypto.randomUUID();
    await db.insert(users).values({ id: userId, name, phone, email, passwordHash: await hashPassword(password), role: "customer" });
    await createCustomerSession(userId, request.url);
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create account." }, { status: 500 });
  }
}
