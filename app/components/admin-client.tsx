"use client";

import { useEffect, useState } from "react";

type Product = { id: string; name: string; description: string; priceCents: number; imageUrl: string; status: string };
type Order = { id: string; orderNumber: string; customerName: string; customerEmail: string; deliveryDate: string; deliveryWindow: string; totalCents: number; status: string; paymentStatus: string; addressText: string; items: string; customerNote: string; paymentProofAvailable: boolean };
type Administrator = { id: string; name: string; email: string; phone: string; role: string; createdAt: string };
type AdminProfile = { name: string; email: string; initials: string };

const blankProduct = { name: "", description: "", price: "", imageUrl: "/bakery-hero.png", status: "in_stock" };
const blankAdministrator = { name: "", email: "", password: "", phone: "" };

export function AdminClient({ profile }: { profile: AdminProfile }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [newProduct, setNewProduct] = useState(blankProduct);
  const [newAdministrator, setNewAdministrator] = useState(blankAdministrator);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [productsResponse, ordersResponse, administratorsResponse] = await Promise.all([
      fetch("/api/admin/products"),
      fetch("/api/admin/orders"),
      fetch("/api/admin/administrators"),
    ]);
    if (productsResponse.ok) setProducts((await productsResponse.json()).products || []);
    if (ordersResponse.ok) {
      const data = await ordersResponse.json();
      setOrders((data.orders || []).map((row: any) => ({
        id: row.order.id,
        orderNumber: row.order.orderNumber,
        customerName: row.customer.name,
        customerEmail: row.customer.email,
        deliveryDate: row.order.deliveryDate,
        deliveryWindow: row.order.deliveryWindow,
        totalCents: row.order.totalCents,
        status: row.order.status,
        paymentStatus: row.order.paymentStatus,
        addressText: `${row.address.line1}, ${row.address.postcode} ${row.address.city}, ${row.address.state}`,
        items: row.items.map((item: any) => `${item.productName} × ${item.quantity}`).join(", "),
        customerNote: row.customerNote || "",
        paymentProofAvailable: Boolean(row.paymentProofAvailable),
      })));
    }
    if (administratorsResponse.ok) setAdministrators((await administratorsResponse.json()).administrators || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createProduct(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newProduct, priceCents: Math.round(Number(newProduct.price) * 100) }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Could not create product.");
    setNewProduct(blankProduct);
    setMessage("Product created successfully.");
    load();
  }

  async function saveProduct(product: Product) {
    const response = await fetch("/api/admin/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: product.id, name: product.name, description: product.description, priceCents: product.priceCents, imageUrl: product.imageUrl, status: product.status }) });
    const data = await response.json();
    setMessage(response.ok ? "Product updated successfully." : data.error || "Could not update product.");
  }

  async function removeProduct(id: string) {
    if (!window.confirm("Delete this product?")) return;
    const response = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setMessage(response.ok ? "Product deleted." : "Could not delete product.");
    load();
  }

  async function updateOrder(order: Order, field: "status" | "paymentStatus", value: string) {
    const response = await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: order.id, [field]: value }) });
    setMessage(response.ok ? "Order status updated." : "Could not update order.");
    load();
  }

  async function addAdministrator(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/administrators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newAdministrator) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Could not add administrator.");
    setNewAdministrator(blankAdministrator);
    setMessage("Administrator saved successfully.");
    load();
  }

  async function removeAdministrator(id: string) {
    if (!window.confirm("Remove administrator access from this account?")) return;
    const response = await fetch(`/api/admin/administrators?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json();
    setMessage(response.ok ? "Administrator access removed." : data.error || "Could not remove administrator.");
    load();
  }

  const inStock = products.filter((product) => product.status === "in_stock").length;
  const openOrders = orders.filter((order) => !["completed", "cancelled"].includes(order.status)).length;

  return <div className="admin-console">
    <header className="admin-topbar">
      <div className="admin-brand"><span className="admin-brand-mark">HB</span><span><strong>Hue Bakery</strong><small>Operations center</small></span></div>
      <div className="admin-topbar-actions"><span className="admin-secure-label"><i /> Admin workspace</span><div className="admin-current-profile"><span className="admin-current-avatar" aria-hidden="true">{profile.initials}</span><span><strong>{profile.name}</strong><small>{profile.email}</small></span></div></div>
    </header>
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <p className="admin-sidebar-label">Workspace</p>
        <a href="#overview" className="admin-sidebar-link active"><span>▦</span> Overview</a>
        <a href="#orders" className="admin-sidebar-link"><span>◷</span> Orders</a>
        <a href="#products" className="admin-sidebar-link"><span>◇</span> Products</a>
        <a href="#administrators" className="admin-sidebar-link"><span>♙</span> Administrators</a>
        <div className="admin-sidebar-footer"><span className="admin-status-dot" /> All systems ready<br /><small>D1 database connected</small></div>
      </aside>
      <main className="admin-content">
        <div className="admin-heading-row"><div><span className="admin-kicker">Dashboard / Overview</span><h1>Good morning, bakery team.</h1><p>Keep the bake list fresh and every delivery moving smoothly.</p></div><button className="admin-refresh" type="button" onClick={load}>↻ Refresh data</button></div>
        {message && <p className="admin-alert">{message}</p>}
        <section id="overview" className="admin-metrics"><article><span className="metric-icon metric-yellow">◇</span><div><small>Menu products</small><strong>{products.length}</strong><em>{inStock} currently in stock</em></div></article><article><span className="metric-icon metric-blue">◷</span><div><small>Open orders</small><strong>{openOrders}</strong><em>{orders.length} total orders</em></div></article><article><span className="metric-icon metric-pink">✦</span><div><small>Administrators</small><strong>{administrators.length}</strong><em>Protected accounts</em></div></article><article><span className="metric-icon metric-lilac">RM</span><div><small>Order value</small><strong>RM {orders.reduce((sum, order) => sum + order.totalCents, 0) / 100}</strong><em>Across all orders</em></div></article></section>

        <section id="orders" className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-kicker">Fulfilment</span><h2>Delivery orders</h2></div><span className="admin-count-badge">{orders.length} orders</span></div><div className="admin-orders">{loading ? <p className="admin-empty">Loading order desk…</p> : orders.length ? orders.map((order) => <article className="admin-order-row" key={order.id}><div><strong>{order.orderNumber}</strong><p>{order.customerName} · {order.customerEmail}</p><p>{order.items}</p><p>{order.addressText}</p>{order.customerNote && <p className="admin-delivery-note"><b>Delivery note:</b> {order.customerNote}</p>}{order.paymentProofAvailable ? <a className="admin-proof-link" href={`/api/admin/orders/proof?orderNumber=${encodeURIComponent(order.orderNumber)}`} target="_blank" rel="noreferrer">View payment proof</a> : <span className="admin-proof-missing">No payment proof uploaded</span>}</div><div className="admin-order-timing"><b>{order.deliveryDate}</b><span>{order.deliveryWindow}</span><strong>RM {(order.totalCents / 100).toFixed(2).replace(".00", "")}</strong></div><div className="admin-selects"><label>Order status<select value={order.status} onChange={(event) => updateOrder(order, "status", event.target.value)}><option value="pending">Pending</option><option value="preparing">Preparing</option><option value="out_for_delivery">Out for delivery</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label><label>Payment<select value={order.paymentStatus} onChange={(event) => updateOrder(order, "paymentStatus", event.target.value)}><option value="awaiting_proof">Awaiting proof</option><option value="proof_submitted">Proof submitted</option><option value="paid">Paid</option><option value="rejected">Rejected</option></select></label></div></article>) : <p className="admin-empty">No orders yet. New customer orders will appear here automatically.</p>}</div></section>

        <section id="products" className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-kicker">Catalogue</span><h2>Product management</h2></div><span className="admin-count-badge">{products.length} items</span></div><div className="admin-product-list">{products.map((product) => <div className="admin-product-row" key={product.id}><div className="admin-product-preview"><span>{product.name.includes("Cheesy") ? "🧀" : product.name.includes("Seasonal") ? "🍞" : "🥖"}</span><small>{product.id}</small></div><div className="admin-product-fields"><input value={product.name} onChange={(event) => setProducts(products.map((item) => item.id === product.id ? { ...item, name: event.target.value } : item))} aria-label="Product name" /><textarea value={product.description} onChange={(event) => setProducts(products.map((item) => item.id === product.id ? { ...item, description: event.target.value } : item))} aria-label="Product description" /><input type="number" step="0.01" value={(product.priceCents / 100).toFixed(2)} onChange={(event) => setProducts(products.map((item) => item.id === product.id ? { ...item, priceCents: Math.round(Number(event.target.value) * 100) } : item))} aria-label="Product price" /></div><select className="admin-stock-select" value={product.status} onChange={(event) => setProducts(products.map((item) => item.id === product.id ? { ...item, status: event.target.value } : item))}><option value="in_stock">In stock</option><option value="out_of_stock">Out of stock</option></select><div className="admin-actions"><button className="admin-action-primary" type="button" onClick={() => saveProduct(product)}>Save</button><button className="admin-action-danger" type="button" onClick={() => removeProduct(product.id)}>Delete</button></div></div>)}</div><form className="admin-add-form" onSubmit={createProduct}><div><span className="admin-kicker">New catalogue item</span><h3>Add product</h3></div><input placeholder="Product name" value={newProduct.name} onChange={(event) => setNewProduct({ ...newProduct, name: event.target.value })} required /><input placeholder="Short description" value={newProduct.description} onChange={(event) => setNewProduct({ ...newProduct, description: event.target.value })} required /><input placeholder="Price in RM" type="number" step="0.01" value={newProduct.price} onChange={(event) => setNewProduct({ ...newProduct, price: event.target.value })} required /><button className="admin-action-primary" type="submit">Add product</button></form></section>

        <section id="administrators" className="admin-panel admin-administrator-panel"><div className="admin-panel-heading"><div><span className="admin-kicker">Access control</span><h2>Administrator management</h2><p>Only trusted team members should receive access to customer data and order operations.</p></div><span className="admin-count-badge">{administrators.length} admins</span></div><div className="administrator-list">{administrators.map((administrator) => <article className="administrator-row" key={administrator.id}><span className="administrator-avatar">{administrator.name.slice(0, 1).toUpperCase()}</span><div><strong>{administrator.name}</strong><p>{administrator.email}</p>{administrator.phone && <small>{administrator.phone}</small>}</div><span className="administrator-role">ADMIN</span><button className="admin-action-danger" type="button" onClick={() => removeAdministrator(administrator.id)}>Remove access</button></article>)}</div><form className="admin-add-administrator" onSubmit={addAdministrator}><div><span className="admin-kicker">Team access</span><h3>Add administrator</h3><p>Create or promote an account with secure administrator access.</p></div><label>Name<input value={newAdministrator.name} onChange={(event) => setNewAdministrator({ ...newAdministrator, name: event.target.value })} required /></label><label>Email<input type="email" value={newAdministrator.email} onChange={(event) => setNewAdministrator({ ...newAdministrator, email: event.target.value })} required /></label><label>Temporary password<input type="password" value={newAdministrator.password} onChange={(event) => setNewAdministrator({ ...newAdministrator, password: event.target.value })} minLength={8} required /></label><label>Phone <span>(optional)</span><input value={newAdministrator.phone} onChange={(event) => setNewAdministrator({ ...newAdministrator, phone: event.target.value })} /></label><button className="admin-action-primary" type="submit">Add administrator</button></form></section>
      </main>
    </div>
  </div>;
}
