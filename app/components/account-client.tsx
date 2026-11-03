"use client";

import { Link } from "./site-link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMalaysiaPhone } from "../../lib/validation";

type Address = { id: string; label: string; recipientName: string; phone: string; line1: string; line2?: string; city: string; state: string; postcode: string };
type CustomerOrder = { id: string; orderNumber: string; deliveryDate: string; deliveryWindow: string; totalCents: number; status: string; paymentStatus: string; items: Array<{ productName: string; quantity: number }> };
const empty = { label: "Home", recipientName: "", phone: "+60", line1: "", line2: "", city: "", state: "", postcode: "" };
const malaysianStates = ["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Sabah", "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"];

export function AccountClient() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; phone: string } | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    const [me, saved, history] = await Promise.all([fetch("/api/auth/me"), fetch("/api/addresses"), fetch("/api/orders")]);
    if (me.ok) setUser((await me.json()).user);
    if (saved.ok) setAddresses((await saved.json()).addresses || []);
    if (history.ok) setOrders((await history.json()).orders || []);
  }
  useEffect(() => { load(); }, []);
  async function addAddress(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(data.error || "Could not save this address.");
    setAddresses(data.addresses || []); setForm(empty); setMessage("Address saved.");
  }
  async function removeAddress(id: string) {
    const response = await fetch(`/api/addresses?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) setAddresses((await response.json()).addresses || []);
  }
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); }
  return <div className="account-dashboard"><div className="account-layout">
    <section className="account-card profile-card"><span className="eyebrow">Customer profile</span><div className="profile-avatar">{user?.name?.slice(0, 1).toUpperCase() || "H"}</div><h2>{user?.name || "Customer"}</h2><p>{user?.email}</p><p>{user?.phone}</p><button className="text-button" onClick={logout}>Log out</button></section>
    <section className="account-card"><div className="section-heading"><div><span className="eyebrow">Saved addresses</span><h2>Where should we deliver?</h2></div><span className="address-limit">{addresses.length}/5</span></div><div className="address-grid">{addresses.map((address) => <article className="address-card" key={address.id}><div className="address-card-top"><strong>{address.label}</strong><button className="icon-button" onClick={() => removeAddress(address.id)} aria-label={`Delete ${address.label} address`}>×</button></div><b>{address.recipientName}</b><p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />{address.postcode} {address.city}, {address.state}<br />{address.phone}</p></article>)}</div>{addresses.length < 5 && <form className="address-form" onSubmit={addAddress}><h3>Add a delivery address</h3><div className="form-grid"><label>Label<input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required /></label><label>Recipient name<input value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} required /></label><label>Phone number<input value={form.phone} onChange={(e) => setForm({ ...form, phone: formatMalaysiaPhone(e.target.value) })} placeholder="+6012-7778383" inputMode="tel" pattern="\+601\d-\d{7,8}" title="Use Malaysia format +6012-7778383" required /></label><label>Postcode<input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value.replace(/\D/g, "").slice(0, 5) })} inputMode="numeric" maxLength={5} required /></label><label className="full-field">Address line 1<input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} required /></label><label className="full-field">Address line 2 <span>(optional)</span><input value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} /></label><label>City<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></label><label>State<select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required><option value="">Select a Malaysian state</option>{malaysianStates.map((state) => <option value={state} key={state}>{state}</option>)}</select></label></div>{message && <p className="form-message">{message}</p>}<button className="button button-dark" disabled={busy}>{busy ? "Saving…" : "Save address"}</button></form>}<p className="small-note"><Link href="/checkout">Ready to order? Go to checkout →</Link></p></section>
  </div><section className="account-card order-history"><div className="section-heading"><div><span className="eyebrow">Your orders</span><h2>Order history</h2></div><span className="address-limit">{orders.length}</span></div>{orders.length ? <div className="order-history-list">{orders.map((order) => <article className="order-history-row" key={order.id}><div><strong>{order.orderNumber}</strong><p>{order.items.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}</p></div><div><b>{order.deliveryDate}</b><p>{order.deliveryWindow}</p></div><div><strong>RM {(order.totalCents / 100).toFixed(2).replace(".00", "")}</strong><span className={`status-pill status-${order.status}`}>{order.status.replaceAll("_", " ")}</span><small>{order.paymentStatus.replaceAll("_", " ")}</small></div></article>)}</div> : <div className="empty-history"><p>No orders yet. Your freshly baked orders will appear here.</p><Link className="button button-dark" href="/menu">Browse menu</Link></div>}</section></div>;
}
