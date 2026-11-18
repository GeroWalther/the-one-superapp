import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { requestOffering } from "@/lib/selection/service";

/** Asks the partner for one offering; answers with the conversation. */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  let body: { offeringId?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_json", 400);
  }
  if (typeof body.offeringId !== "string") return apiError("missing_offering", 400);

  const result = await requestOffering({
    accountId: auth.account.id,
    displayName: auth.account.displayName,
    offeringId: body.offeringId,
  });
  if (!result) return apiError("not_found", 404);
  return NextResponse.json(result);
}
