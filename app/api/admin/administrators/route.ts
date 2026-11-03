import { and, asc, count, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { getCustomer, hashPassword, isAdmin } from "../../../../lib/auth";
import { rejectCrossOriginRequest, rejectOversizedBody } from "../../../../lib/security";

async function guard() {
  return Boolean(await isAdmin());
}

export async function GET() {
  if (!(await guard())) return Response.json({ error: "Administrator access required." }, { status: 403 });
  const administrators = await getDb().select({ id: users.id, name: users.name, email: users.email, phone: users.phone, role: users.role, createdAt: users.createdAt }).from(users).where(eq(users.role, "admin")).orderBy(asc(users.createdAt));
  return Response.json({ administrators });
}

export async function POST(request: Request) {
  if (!(await guard())) return Response.json({ error: "Administrator access required." }, { status: 403 });
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const sizeError = rejectOversizedBody(request, 16 * 1024);
  if (sizeError) return sizeError;
  const payload = await request.json() as { name?: string; email?: string; password?: string; phone?: string };
  const name = payload.name?.trim() ?? "";
  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = payload.password ?? "";
  if (name.length < 2 || name.length > 100 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || password.length < 8 || password.length > 128) return Response.json({ error: "Name, a valid email and a password of at least 8 characters are required." }, { status: 400 });

  const db = getDb();
  const passwordHash = await hashPassword(password);
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    await db.update(users).set({ name, role: "admin", passwordHash, ...(payload.phone !== undefined ? { phone: payload.phone.trim() } : {}) }).where(eq(users.id, existing.id));
  } else {
    await db.insert(users).values({ id: crypto.randomUUID(), name, email, phone: payload.phone?.trim() ?? "", passwordHash, role: "admin" });
  }
  const [administrator] = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, role: users.role, createdAt: users.createdAt }).from(users).where(eq(users.email, email)).limit(1);
  return Response.json({ administrator }, { status: existing ? 200 : 201 });
}

export async function DELETE(request: Request) {
  if (!(await guard())) return Response.json({ error: "Administrator access required." }, { status: 403 });
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Administrator id is required." }, { status: 400 });
  const currentCustomer = await getCustomer();
  if (currentCustomer?.id === id) return Response.json({ error: "You cannot remove the administrator account currently in use." }, { status: 400 });
  const [{ total }] = await getDb().select({ total: count() }).from(users).where(eq(users.role, "admin"));
  if (Number(total) <= 1) return Response.json({ error: "Keep at least one administrator account." }, { status: 400 });
  await getDb().update(users).set({ role: "customer" }).where(and(eq(users.id, id), eq(users.role, "admin")));
  return Response.json({ ok: true });
}
