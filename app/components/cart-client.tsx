"use client";

import { Link } from "./site-link";
import { useEffect, useState } from "react";
import { CartItem, readCart, saveCart } from "./site";

export function CartClient() {
  const [cart, setCart] = useState<CartItem[]>([]);
  useEffect(() => { const update = () => setCart(readCart()); update(); window.addEventListener("hue-cart-updated", update); return () => window.removeEventListener("hue-cart-updated", update); }, []);
  const update = (items: CartItem[]) => { setCart(items); saveCart(items); };
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!cart.length) return <section className="empty-cart"><div className="empty-cart-icon">🥐</div><h2>Your basket is waiting.</h2><p>Choose a few freshly baked favourites from our menu.</p><Link href="/menu" className="button button-dark">Browse menu</Link></section>;
  return <div className="cart-layout"><section className="cart-items">{cart.map((item) => <article className="cart-item" key={item.productId}><div className="product-icon">🥖</div><div className="cart-item-info"><h3>{item.product}</h3><p>RM {item.price.toFixed(2).replace(".00", "")} each</p></div><div className="quantity-control"><button onClick={() => update(cart.map((row) => row.productId === item.productId ? { ...row, quantity: Math.max(1, row.quantity - 1) } : row))}>−</button><span>{item.quantity}</span><button onClick={() => update(cart.map((row) => row.productId === item.productId ? { ...row, quantity: row.quantity + 1 } : row))}>+</button></div><strong>RM {(item.price * item.quantity).toFixed(2).replace(".00", "")}</strong><button className="remove-item" onClick={() => update(cart.filter((row) => row.productId !== item.productId))}>Remove</button></article>)}</section><aside className="cart-summary"><span className="eyebrow">Order summary</span><h2>Almost there.</h2><div className="summary-line"><span>Subtotal</span><strong>RM {subtotal.toFixed(2).replace(".00", "")}</strong></div><div className="summary-line"><span>Delivery</span><span>Calculated at checkout</span></div><div className="summary-total"><span>Total before delivery</span><strong>RM {subtotal.toFixed(2).replace(".00", "")}</strong></div><Link className="button button-dark full-button" href="/checkout">Continue to checkout →</Link><Link className="back-link" href="/menu">← Continue shopping</Link></aside></div>;
}
