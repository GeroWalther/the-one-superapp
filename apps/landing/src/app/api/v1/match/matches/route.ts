import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { matchesFor } from "@/lib/match/service";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  if (auth.account.role !== "member") return apiError("forbidden", 403);

  return NextResponse.json({ matches: await matchesFor(auth.account.id) });
}
