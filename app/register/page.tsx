import { Link } from "../components/site-link";
import { RegisterForm } from "../components/auth-forms";
import { SiteHeader, SiteFooter } from "../components/site";
import { getCustomer } from "../../lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const customer = await getCustomer();
  if (customer) redirect("/account");
  return <><SiteHeader active="home" /><main><section className="auth-page section-shell"><div className="auth-copy"><p className="eyebrow">A little account for a little bakery</p><h1>Keep your<br /><em>bread days easy.</em></h1><p>We only ask for basic identification details so we can prepare delivery and order updates.</p></div><div className="auth-card"><p className="eyebrow">Customer registration</p><h2>Create account</h2><RegisterForm /><p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p></div></section></main><SiteFooter /></>;
}
