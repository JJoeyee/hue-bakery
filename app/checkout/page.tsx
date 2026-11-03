import { Link } from "../components/site-link";
import { getCustomer } from "../../lib/auth";
import { SiteFooter, SiteHeader } from "../components/site";
import { CheckoutClient } from "../components/checkout-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export default async function CheckoutPage() { const customer = await getCustomer(); if (customer?.role === "admin") redirect("/admin"); return <><SiteHeader active="cart" /><main className="checkout-page section-shell"><div className="page-hero compact"><span className="eyebrow">Checkout</span><h1>Choose a little time for your bakes.</h1><p>We will prepare your order for the delivery window you select.</p></div>{customer ? <CheckoutClient /> : <section className="auth-card centered-card"><h2>Sign in to continue</h2><p>We need your saved delivery details before we can take the order.</p><Link className="button button-dark" href="/login?returnTo=/checkout">Sign in</Link><Link className="back-link" href="/register?returnTo=/checkout">New here? Create an account</Link></section>}</main><SiteFooter /></>; }
