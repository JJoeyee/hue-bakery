import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { createCustomerSession, provisionBootstrapAdmin, verifyPassword } from "../../../../lib/auth";
import { consumeRateLimit, rejectCrossOriginRequest, rejectOversizedBody, rateLimitResponse } from "../../../../lib/security";

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const sizeError = rejectOversizedBody(request, 8 * 1024);
  if (sizeError) return sizeError;
  if (!consumeRateLimit(request, "login", 10, 15 * 60_000)) return rateLimitResponse();
  const payload = await request.json() as { email?: string; password?: string };
  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = payload.password ?? "";
  if (!email || !password) return Response.json({ error: "Email and password are required." }, { status: 400 });
  try {
    const user = await provisionBootstrapAdmin(email, password) ?? (await getDb().select().from(users).where(eq(users.email, email)).limit(1))[0];
    if (!user || !(await verifyPassword(password, user.passwordHash))) return Response.json({ error: "Email or password is incorrect." }, { status: 401 });
    await createCustomerSession(user.id, request.url);
    return Response.json({ ok: true, user: { name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to sign in." }, { status: 500 });
  }
}
