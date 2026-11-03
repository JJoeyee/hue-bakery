import { Link } from "../components/site-link";
import { LoginForm } from "../components/auth-forms";
import { SiteHeader, SiteFooter } from "../components/site";
import { getCustomer } from "../../lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const customer = await getCustomer();
  if (customer) redirect("/account");
  return <><SiteHeader active="home" /><main><section className="auth-page section-shell"><div className="auth-copy"><p className="eyebrow">Welcome back</p><h1>Sign in for<br /><em>easy checkout.</em></h1><p>Save your details, keep up to five delivery addresses and view your order history.</p></div><div className="auth-card"><p className="eyebrow">Customer login</p><h2>Sign in</h2><LoginForm /><p className="auth-switch">New here? <Link href="/register">Create an account</Link></p></div></section></main><SiteFooter /></>;
}
