import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { selectionFeed } from "@/lib/selection/service";

/** TheONE SELECTION for this member: chosen for you, then each area. */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json(await selectionFeed(auth.account.id));
}
