import { SiteFooter, SiteHeader } from "../components/site";
import { CartClient } from "../components/cart-client";

export default function CartPage() { return <><SiteHeader active="cart" /><main className="cart-page section-shell"><div className="page-hero compact"><span className="eyebrow">Your basket</span><h1>A little box of comfort.</h1><p>Review your bakes before choosing a delivery time.</p></div><CartClient /></main><SiteFooter /></>; }
