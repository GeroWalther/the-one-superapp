import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { selectionFeed } from "@/lib/selection/service";

/** One TheONE area for this member: SELECTION with "chosen for you", or LONGEVITY, HEALTH, TRAVEL, REAL ESTATE. */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  // `?area=`: selection (products), longevity, health, hotels, travel (flights), realestate.
  const area = new URL(request.url).searchParams.get("area") ?? "selection";
  return NextResponse.json(await selectionFeed(auth.account.id, area));
}
