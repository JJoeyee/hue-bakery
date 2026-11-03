import { clearCustomerSession } from "../../../../lib/auth";
import { rejectCrossOriginRequest } from "../../../../lib/security";

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;
  await clearCustomerSession();
  return Response.json({ ok: true });
}
