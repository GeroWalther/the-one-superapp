import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { greeting, isAssistantConfigured, languageTag } from "@/lib/ai/assistant";

/**
 * The personal greeting the app speaks when a signed-in member opens it.
 * The body carries `hour`, the member's local hour (0 to 23); `language`, the
 * phone's language tag the greeting is spoken in; and `matches`, first names
 * of MATCH matches the member has not been told about yet.
 */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  if (!isAssistantConfigured()) {
    return apiError("assistant_not_configured", 503);
  }

  let body: { hour?: unknown; language?: unknown; matches?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // No body: midday, the account's language, no matches.
  }
  const raw = Number(body.hour);
  const hour = Number.isInteger(raw) && raw >= 0 && raw <= 23 ? raw : 12;
  const matches = Array.isArray(body.matches)
    ? body.matches
        .filter((name): name is string => typeof name === "string")
        .map((name) => name.trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const text = await greeting(auth.account, hour, languageTag(body.language), matches);
  if (!text) return apiError("unavailable", 503);

  return NextResponse.json({ greeting: text });
}
