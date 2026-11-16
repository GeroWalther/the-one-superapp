import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { dailyTip, isAssistantConfigured, languageTag } from "@/lib/ai/assistant";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  if (!isAssistantConfigured()) {
    return apiError("assistant_not_configured", 503);
  }

  // `?language=` from the phone, so the tip is in the member's language.
  const language = languageTag(new URL(request.url).searchParams.get("language"));
  const tip = await dailyTip(auth.account, language);
  if (!tip) return apiError("unavailable", 503);

  return NextResponse.json({ tip });
}
