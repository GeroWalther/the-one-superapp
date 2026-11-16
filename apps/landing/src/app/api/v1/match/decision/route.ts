import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { decide } from "@/lib/match/service";

/** A yes or no to one suggestion. A yes both ways answers with the match. */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  if (auth.account.role !== "member") return apiError("forbidden", 403);

  let body: { targetId?: unknown; decision?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_json", 400);
  }

  if (typeof body.targetId !== "string") return apiError("missing_target", 400);
  if (body.decision !== "like" && body.decision !== "pass") {
    return apiError("invalid_decision", 400);
  }

  const result = await decide({
    accountId: auth.account.id,
    targetId: body.targetId,
    decision: body.decision,
  });
  if (!result.ok) return apiError(result.reason, 404);

  return NextResponse.json(
    result.matched ? { matched: true, match: result.match } : { matched: false },
  );
}
