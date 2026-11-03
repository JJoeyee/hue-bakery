import { Link } from "../components/site-link";
import { CartBar, ProductCard, SiteFooter, SiteHeader } from "../components/site";
import { getCustomer } from "../../lib/auth";
import { getProducts } from "../../lib/catalog";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const customer = await getCustomer();
  const products = await getProducts();

  return <><SiteHeader active="menu" /><main><section className="page-hero section-shell"><p className="eyebrow"><span className="eyebrow-dot" /> Freshly baked, slowly made</p><h1>Choose your<br /><em>bread friend.</em></h1><p>Our bake list changes with the bake day. Add your favourites to a basket, then we’ll confirm availability and delivery details with you.</p></section><section className="section-shell menu-page-section"><div className="menu-note"><span>♡</span><p><strong>Menu note</strong><br />Prices and availability are managed by Hue Bakery. Final delivery fees and bake slots are confirmed before payment.</p></div><div className="full-product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></section><section className="shipping-strip section-shell"><div><p className="eyebrow">Delivery &amp; collection</p><h2>From our oven<br /><em>to your table.</em></h2></div><div className="shipping-points"><p><span>01</span><strong>West Malaysia shipping</strong><br />Next-day delivery may be available for selected locations. Ask us for the latest delivery slot.</p><p><span>02</span><strong>Freshly packed</strong><br />We confirm the order details with you before preparing the bake.</p></div></section><section className="section-shell login-callout">{customer ? <><p className="eyebrow">Welcome back</p><h2>Your details are<br /><em>ready for checkout.</em></h2><p>Hi {customer.name}! Your account and saved delivery details are ready whenever you are.</p><Link className="button button-dark" href="/account">Open my account</Link></> : <><p className="eyebrow">Ready to order?</p><h2>Save your details<br /><em>for checkout.</em></h2><p>Sign in to keep up to five delivery addresses and choose a delivery schedule.</p><Link className="button button-dark" href="/login">Sign in / Create account</Link></>}</section></main><SiteFooter /><CartBar /></>;
}
