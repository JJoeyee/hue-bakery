import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { products } from "../../../db/schema";
import { starterProducts } from "../../../lib/catalog";

export async function GET() {
  try {
    const rows = await getDb().select().from(products).where(eq(products.status, "in_stock")).orderBy(asc(products.name));
    return Response.json({ products: rows.length ? rows : starterProducts });
  } catch {
    return Response.json({ products: starterProducts });
  }
}
