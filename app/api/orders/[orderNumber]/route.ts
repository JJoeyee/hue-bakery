import { NextResponse } from "next/server";
import { getCustomer } from "../../../../lib/auth";
import { getDb } from "../../../../db";
import { orders } from "../../../../db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: Promise<{ orderNumber: string }> }) { const user = await getCustomer(); if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 }); const { orderNumber } = await params; const db = getDb(); const rows = await db.select().from(orders).where(and(eq(orders.orderNumber, orderNumber), eq(orders.userId, user.id))).limit(1); if (!rows[0]) return NextResponse.json({ error: "Order not found" }, { status: 404 }); return NextResponse.json({ order: rows[0] }); }
