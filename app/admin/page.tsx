import { getCustomer, isAdmin } from "../../lib/auth";
import { AdminClient } from "../components/admin-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const customer = await getCustomer();
  if (!customer) redirect("/login?returnTo=/admin");
  const allowed = await isAdmin();
  if (!allowed) redirect("/account?admin=denied");

  const profileName = customer.name;
  const profileEmail = customer.email;
  const profileInitials = profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "A";

  return <main className="admin-page admin-backend-page"><AdminClient profile={{ name: profileName, email: profileEmail, initials: profileInitials }} /></main>;
}
