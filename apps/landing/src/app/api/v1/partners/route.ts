import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { authenticateRequest } from "@/lib/api/auth";
import { searchPartners } from "@/lib/api/partners";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const partners = await searchPartners({
    accountId: new ObjectId(auth.account.id),
    query: url.searchParams.get("q") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    focusArea: url.searchParams.get("focus") ?? undefined,
    city: url.searchParams.get("city") ?? undefined,
    savedOnly: url.searchParams.get("saved") === "1",
  });

  return NextResponse.json({ partners });
}
