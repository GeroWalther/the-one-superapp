import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { confirmPlan } from "@/lib/plans/service";

/** The member's one tap: the plan goes to every partner in it at once. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const plan = await confirmPlan(auth.account, id);
  if (!plan) return apiError("not_found", 404);
  return NextResponse.json({ plan });
}
