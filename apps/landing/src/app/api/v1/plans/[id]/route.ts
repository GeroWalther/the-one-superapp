import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { getPlan } from "@/lib/plans/service";

/** One plan POWER AI put together for the member. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const plan = await getPlan(auth.account.id, id);
  if (!plan) return apiError("not_found", 404);
  return NextResponse.json({ plan });
}
