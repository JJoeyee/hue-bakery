import { Link } from "../components/site-link";
import { getCustomer } from "../../lib/auth";
import { SiteFooter, SiteHeader } from "../components/site";
import { AccountClient } from "../components/account-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const customer = await getCustomer();
  if (customer?.role === "admin") redirect("/admin");
  return <>
    <SiteHeader active="account" />
    <main className="account-page section-shell">
      <div className="page-hero compact"><span className="eyebrow">Your Hue Bakery account</span><h1>Keep your favourite delivery details close.</h1><p>Save up to five addresses so checkout stays quick and easy.</p></div>
      {customer ? <AccountClient /> : <section className="auth-card centered-card"><h2>Please sign in first</h2><p>Create an account to save addresses and place delivery orders.</p><Link className="button button-dark" href="/login?returnTo=/account">Sign in</Link></section>}
    </main>
    <SiteFooter />
  </>;
}
