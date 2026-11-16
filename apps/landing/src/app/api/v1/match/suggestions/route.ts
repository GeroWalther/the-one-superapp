import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { suggestionsFor } from "@/lib/match/service";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  if (auth.account.role !== "member") return apiError("forbidden", 403);

  const result = await suggestionsFor(auth.account.id);
  if (!result.ok) return apiError(result.reason, 404);
  return NextResponse.json({ suggestions: result.cards });
}
