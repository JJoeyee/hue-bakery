import { getCustomer } from "../../../../lib/auth";

export async function GET() {
  const user = await getCustomer();
  return Response.json({ user: user ? { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role } : null });
}
