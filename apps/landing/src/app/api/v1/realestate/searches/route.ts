import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { listPropertySearches, startPropertySearch, type PropertySearchInput } from "@/lib/realestate/service";

/** What the member is looking for through TheONE REAL ESTATE, latest first. */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ searches: await listPropertySearches(auth.account.id) });
}

/** Sends the member's wishes to the best brokers for that place. */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  let body: PropertySearchInput;
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_json", 400);
  }
  const result = await startPropertySearch({
    accountId: auth.account.id,
    displayName: auth.account.displayName,
    wish: body,
  });
  if (!result.ok) {
    const status = result.reason === "limit" ? 429 : result.reason === "invalid" ? 400 : 404;
    return apiError(result.reason, status);
  }
  return NextResponse.json({ search: result.search }, { status: 201 });
}
