"use client";

import { Link } from "./site-link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CartItem, readCart } from "./site";

type Address = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postcode: string;
};

const deliveryWindows = ["10:00–13:00", "14:00–17:00", "18:00–21:00"];

function dateOptions() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    return {
      value: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("en-MY", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    };
  });
}

export function CheckoutClient() {
  const router = useRouter();
  const dates = useMemo(dateOptions, []);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(dates[0].value);
  const [deliveryWindow, setDeliveryWindow] = useState(deliveryWindows[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCart(readCart());
    fetch("/api/addresses")
      .then((response) => response.json())
      .then((data) => {
        const saved = data.addresses || [];
        setAddresses(saved);
        if (saved[0]) setAddressId(saved[0].id);
      });
  }, []);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  async function placeOrder(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!addressId) return setError("Please choose or add a delivery address.");
    if (!cart.length) return setError("Your basket is empty.");

    setBusy(true);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        addressId,
        deliveryDate,
        deliveryWindow,
        note,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) return setError(data.error || "Could not create this order.");

    localStorage.removeItem("hue-bakery-cart");
    window.dispatchEvent(new Event("hue-cart-updated"));
    router.push(`/payment?orderNumber=${encodeURIComponent(data.orderNumber)}`);
  }

  if (!cart.length) {
    return (
      <section className="empty-cart">
        <div className="empty-cart-icon">🧺</div>
        <h2>Your basket is empty.</h2>
        <Link href="/menu" className="button button-dark">
          Browse menu
        </Link>
      </section>
    );
  }

  return (
    <form className="checkout-layout" onSubmit={placeOrder}>
      <section className="checkout-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">1 · Delivery address</span>
            <h2>Where shall we send it?</h2>
          </div>
          <Link className="small-link" href="/account">
            Manage addresses
          </Link>
        </div>

        {addresses.length ? (
          <div className="address-select-grid">
            {addresses.map((address) => (
              <label
                className={`address-select-card ${addressId === address.id ? "selected" : ""}`}
                key={address.id}
              >
                <input
                  type="radio"
                  name="address"
                  value={address.id}
                  checked={addressId === address.id}
                  onChange={() => setAddressId(address.id)}
                />
                <span>
                  <strong>{address.label}</strong>
                  <b>{address.recipientName}</b>
                  <small>{address.line1}</small>
                  {address.line2 && <small>{address.line2}</small>}
                  <small>
                    {address.postcode} {address.city}, {address.state}
                  </small>
                  <small>{address.phone}</small>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="notice-box">
            You have no saved addresses yet. <Link href="/account">Add one in your account →</Link>
          </div>
        )}

        <div className="section-heading checkout-heading">
          <div>
            <span className="eyebrow">2 · Delivery schedule</span>
            <h2>Choose your delivery time</h2>
          </div>
        </div>

        <div className="select-row">
          <label className="checkout-select-label">
            Delivery date
            <select
              className="checkout-select"
              value={deliveryDate}
              onChange={(event) => setDeliveryDate(event.target.value)}
            >
              {dates.map((date) => (
                <option key={date.value} value={date.value}>
                  {date.label}
                </option>
              ))}
            </select>
          </label>
          <label className="checkout-select-label">
            Time window
            <select
              className="checkout-select"
              value={deliveryWindow}
              onChange={(event) => setDeliveryWindow(event.target.value)}
            >
              {deliveryWindows.map((window) => (
                <option key={window} value={window}>
                  {window}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="note-field">
          Delivery note <span>(optional)</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Gate code, preferred drop-off spot…"
          />
        </label>
      </section>

      <aside className="checkout-card checkout-summary">
        <span className="eyebrow">3 · Review</span>
        <h2>Ready for a bake?</h2>
        {cart.map((item) => (
          <div className="summary-line" key={item.productId}>
            <span>
              {item.product} × {item.quantity}
            </span>
            <strong>RM {(item.price * item.quantity).toFixed(2).replace(".00", "")}</strong>
          </div>
        ))}
        <div className="summary-total">
          <span>Total before delivery</span>
          <strong>RM {subtotal.toFixed(2).replace(".00", "")}</strong>
        </div>
        {error && <p className="error-status">{error}</p>}
        <button className="button button-dark full-button" disabled={busy}>
          {busy ? "Creating order…" : "Place order →"}
        </button>
        <Link className="back-link" href="/cart">
          ← Back to basket
        </Link>
      </aside>
    </form>
  );
}
