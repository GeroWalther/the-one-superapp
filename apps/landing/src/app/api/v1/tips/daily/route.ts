import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { dailyTip, isAssistantConfigured } from "@/lib/ai/assistant";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  if (!isAssistantConfigured()) {
    return apiError("assistant_not_configured", 503);
  }

  const tip = await dailyTip(auth.account);
  if (!tip) return apiError("unavailable", 503);

  return NextResponse.json({ tip });
}
