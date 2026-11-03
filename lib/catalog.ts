import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { products } from "../db/schema";

export const starterProducts = [
  { id: "classic-oubao", name: "Classic Oubao", description: "A golden, crackly loaf with a gentle chew — lovely with butter, jam or simply warm from the bag.", priceCents: 1800, imageUrl: "/bakery-hero.png", status: "in_stock" },
  { id: "cheesy-oubao", name: "Cheesy Oubao", description: "Comforting bread with little pockets of savoury goodness. Great for sharing, even better toasted.", priceCents: 2200, imageUrl: "/bakery-hero.png", status: "in_stock" },
  { id: "seasonal-bakes", name: "Seasonal Bakes", description: "Limited flavours and cosy specials appear from time to time. Follow along so you do not miss the next one.", priceCents: 2000, imageUrl: "/bakery-hero.png", status: "in_stock" },
  { id: "oubao-share-box", name: "Oubao Share Box", description: "A cheerful mix for a small gathering or a thoughtful gift. Ask what is going into the next box.", priceCents: 4800, imageUrl: "/bakery-hero.png", status: "in_stock" },
];

export async function getProducts() {
  try {
    const rows = await getDb().select().from(products);
    return rows.length ? rows : starterProducts;
  } catch {
    return starterProducts;
  }
}

export async function getProductById(id: string) {
  try {
    const [row] = await getDb().select().from(products).where(eq(products.id, id)).limit(1);
    return row ?? starterProducts.find((product) => product.id === id) ?? null;
  } catch {
    return starterProducts.find((product) => product.id === id) ?? null;
  }
}

export async function ensureStarterProducts() {
  const db = getDb();
  for (const product of starterProducts) {
    await db.insert(products).values(product).onConflictDoNothing({ target: products.id });
  }
}
