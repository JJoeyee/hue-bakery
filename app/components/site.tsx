"use client";

import { Link } from "./site-link";
import { useEffect, useState } from "react";

export type Product = { id: string; name: string; description: string; priceCents: number; imageUrl: string; status: string };
export type CartItem = { productId: string; product: string; price: number; quantity: number };
const CART_KEY = "hue-bakery-cart";

export function readCart(): CartItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]") as Array<Partial<CartItem>>;
    return raw.map((item) => ({ productId: item.productId || item.product?.toLowerCase().replaceAll(" ", "-") || "", product: item.product || "Bake", price: Number(item.price || 0), quantity: Number(item.quantity || 1) }));
  } catch { return []; }
}

export function saveCart(items: CartItem[]) { localStorage.setItem(CART_KEY, JSON.stringify(items)); window.dispatchEvent(new Event("hue-cart-updated")); }

export function addProduct(product: Product) {
  const cart = readCart();
  const existing = cart.find((item) => item.productId === product.id);
  if (existing) existing.quantity += 1;
  else cart.push({ productId: product.id, product: product.name, price: product.priceCents / 100, quantity: 1 });
  saveCart(cart);
}

export function SiteHeader({ active }: { active: "home" | "menu" | "about" | "account" | "cart" }) {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState<{ name: string } | null>(null);
  useEffect(() => {
    const update = () => setCount(readCart().reduce((sum, item) => sum + item.quantity, 0));
    update();
    window.addEventListener("hue-cart-updated", update);
    return () => window.removeEventListener("hue-cart-updated", update);
  }, []);
  useEffect(() => {
    let activeRequest = true;
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => {
        if (activeRequest) setUser(data.user || null);
      })
      .catch(() => {
        if (activeRequest) setUser(null);
      });
    return () => { activeRequest = false; };
  }, []);
  const initials = user?.name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "";
  return <><div className="announcement"><span>🥖</span> Slow fermentation Oubao · West Malaysia delivery · Freshly baked</div><header className="site-header"><Link className="brand" href="/" aria-label="Hue Bakery home"><span className="brand-mark">HB</span><span><strong>Hue Bakery</strong><small>会烘焙</small></span></Link><nav className="nav-links" aria-label="Main navigation"><Link className={active === "home" ? "active" : ""} href="/">Home</Link><Link className={active === "menu" ? "active" : ""} href="/menu">Menu</Link><Link className={active === "about" ? "active" : ""} href="/about">About</Link>{user ? <Link className={`header-profile ${active === "account" ? "active" : ""}`} href="/account" aria-label={`Open account for ${user.name}`}><span className="header-avatar" aria-hidden="true">{initials}</span><span className="header-profile-name">{user.name}</span></Link> : <Link className={active === "account" ? "active" : ""} href="/account">Account</Link>}</nav><Link className="button button-dark header-cta" href="/cart">Cart <span className="cart-count" data-cart-count>{count}</span></Link></header></>;
}

export function SiteFooter() {
  return <footer className="site-footer section-shell"><div className="footer-brand"><span className="brand-mark">HB</span><div><strong>Hue Bakery</strong><small>会烘焙 · baked with a little patience</small></div></div><div className="footer-right"><Link href="/about">Contact</Link><Link href="/menu">Menu</Link><span>West Malaysia delivery</span></div></footer>;
}

export function CartBar() {
  const [cart, setCart] = useState<CartItem[]>([]);
  useEffect(() => { const update = () => setCart(readCart()); update(); window.addEventListener("hue-cart-updated", update); return () => window.removeEventListener("hue-cart-updated", update); }, []);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <div className={`cart-bar ${count ? "is-visible" : ""}`}><div><strong>{count} item(s) in your basket</strong><small>Ready when you are.</small></div><Link className="button button-dark" href="/cart">View cart <span>RM {total.toFixed(2).replace(".00", "")}</span></Link></div>;
}

export function ProductCard({ product, featured = false }: { product: Product; featured?: boolean }) {
  const [added, setAdded] = useState(false);
  const icon = product.name.includes("Cheesy") ? "🧀" : product.name.includes("Seasonal") ? "🍞" : product.name.includes("Share") ? "🎁" : "🥖";
  return <article className={`product-card ${featured ? "product-card-yellow" : "product-card-pink"}`}><div className="product-icon" aria-hidden="true">{icon}</div><span className="product-tag">{product.status === "in_stock" ? "Freshly baked" : "Currently unavailable"}</span><h3>{product.name}</h3><p>{product.description}</p><div className="card-footer"><span>RM {(product.priceCents / 100).toFixed(2).replace(".00", "")}</span><button className={`round-arrow add-to-cart ${added ? "added" : ""}`} type="button" disabled={product.status !== "in_stock"} onClick={() => { addProduct(product); setAdded(true); window.setTimeout(() => setAdded(false), 1200); }} aria-label={`Add ${product.name} to cart`}>{added ? "✓" : "+"}</button></div></article>;
}
