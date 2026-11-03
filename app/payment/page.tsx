import { SiteFooter, SiteHeader } from "../components/site";
import { PaymentClient } from "../components/payment-client";
import { getCustomer } from "../../lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export default async function PaymentPage() { const customer = await getCustomer(); if (customer?.role === "admin") redirect("/admin"); return <><SiteHeader active="cart" /><main className="payment-page section-shell"><div className="page-hero compact"><span className="eyebrow">Payment</span><h1>One last little step.</h1><p>Scan the TNG QR code, then send us your payment screenshot so we can confirm your order.</p></div><PaymentClient /></main><SiteFooter /></>; }
