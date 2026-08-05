import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  apiError,
  authenticateRequest,
  revokeAllRefreshTokens,
  revokeRefreshToken,
} from "@/lib/api/auth";

/**
 * Signs out. `allDevices` revokes every session for the account — the thing you
 * want when a phone is lost.
 */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  let body: { refreshToken?: string; allDevices?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // A logout with no body is still a logout.
  }

  if (body.allDevices) {
    await revokeAllRefreshTokens(new ObjectId(auth.account.id));
  } else if (body.refreshToken) {
    await revokeRefreshToken(body.refreshToken);
  } else {
    return apiError("missing_token", 400);
  }

  return NextResponse.json({ ok: true });
}
