import { and, eq, gt } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { getDb } from "../db";
import { sessions, users } from "../db/schema";
import { isValidMalaysiaPhone } from "./validation";

const SESSION_COOKIE = "hue_session";
const SESSION_DAYS = 30;

function runtimeConfig() {
  return env as unknown as Record<string, string | undefined>;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function base64Url(value: string) {
  return value.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function unbase64Url(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  return padded + "=".repeat((4 - (padded.length % 4)) % 4);
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64Url(bytesToBase64(new Uint8Array(digest)));
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const iterations = 100000;
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256);
  return `pbkdf2$${iterations}$${base64Url(bytesToBase64(salt))}$${base64Url(bytesToBase64(new Uint8Array(bits)))}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, iterationText, saltText, hashText] = stored.split("$");
  if (algorithm !== "pbkdf2" || !iterationText || !saltText || !hashText) return false;
  const iterations = Number(iterationText);
  const salt = base64ToBytes(unbase64Url(saltText));
  const expected = base64ToBytes(unbase64Url(hashText));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, expected.length * 8);
  const actual = new Uint8Array(bits);
  return actual.length === expected.length && actual.every((byte, index) => byte === expected[index]);
}

export async function createCustomerSession(userId: string, requestUrl?: string) {
  const token = base64Url(bytesToBase64(crypto.getRandomValues(new Uint8Array(32))));
  const sessionId = await sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await getDb().insert(sessions).values({ id: sessionId, userId, expiresAt });
  const jar = await cookies();
  const secure = requestUrl ? new URL(requestUrl).protocol === "https:" : process.env.NODE_ENV === "production";
  jar.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: SESSION_DAYS * 86400 });
}

export async function provisionBootstrapAdmin(email: string, password: string) {
  const config = runtimeConfig();
  const bootstrapEmail = config.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const bootstrapPassword = config.ADMIN_BOOTSTRAP_PASSWORD;
  if (!bootstrapEmail || !bootstrapPassword || email !== bootstrapEmail || password !== bootstrapPassword) return null;

  const db = getDb();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const passwordHash = await hashPassword(password);
  if (existing?.role === "admin") {
    return existing;
  }
  if (existing) {
    await db.update(users).set({ role: "admin", passwordHash, name: existing.name || "Hue Bakery Admin" }).where(eq(users.id, existing.id));
  } else {
    await db.insert(users).values({ id: crypto.randomUUID(), name: "Hue Bakery Admin", phone: "", email, passwordHash, role: "admin" });
  }
  const [admin] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return admin ?? null;
}

export async function clearCustomerSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await getDb().delete(sessions).where(eq(sessions.id, await sha256(token)));
  jar.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

export async function getCustomer() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const sessionId = await sha256(token);
  const [row] = await getDb().select({ user: users, session: sessions }).from(sessions).innerJoin(users, eq(users.id, sessions.userId)).where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date().toISOString()))).limit(1);
  return row?.user ?? null;
}

export async function isAdmin() {
  const customer = await getCustomer();
  return customer?.role === "admin" ? customer : null;
}

export { isValidMalaysiaPhone };
