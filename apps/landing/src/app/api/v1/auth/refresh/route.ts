import { NextResponse } from "next/server";
import {
  accountPayload,
  apiError,
  issueAccessToken,
  rotateRefreshToken,
} from "@/lib/api/auth";

/** Exchanges a refresh token for a fresh pair, rotating the old one out. */
export async function POST(request: Request) {
  let body: { refreshToken?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_body", 400);
  }

  if (!body.refreshToken) return apiError("missing_token", 400);

  const rotated = await rotateRefreshToken(body.refreshToken);
  if (!rotated) return apiError("invalid_token", 401);

  return NextResponse.json({
    accessToken: await issueAccessToken(rotated.account),
    refreshToken: rotated.refreshToken,
    account: accountPayload(rotated.account),
  });
}
