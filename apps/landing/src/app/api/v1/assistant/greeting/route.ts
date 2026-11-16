import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { greeting, isAssistantConfigured } from "@/lib/ai/assistant";

/**
 * The personal greeting the app speaks when a signed-in member opens it.
 * The body carries `hour`, the member's local hour (0 to 23).
 */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  if (!isAssistantConfigured()) {
    return apiError("assistant_not_configured", 503);
  }

  let raw = Number.NaN;
  try {
    raw = Number(((await request.json()) as { hour?: unknown }).hour);
  } catch {
    // No body: fall back to midday below.
  }
  const hour = Number.isInteger(raw) && raw >= 0 && raw <= 23 ? raw : 12;

  const text = await greeting(auth.account, hour);
  if (!text) return apiError("unavailable", 503);

  return NextResponse.json({ greeting: text });
}
