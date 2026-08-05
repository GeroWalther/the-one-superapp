import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { authenticate } from "@/lib/auth/accounts";
import {
  accountPayload,
  apiError,
  issueAccessToken,
  issueRefreshToken,
} from "@/lib/api/auth";
import { RATE_LIMITS, checkRateLimit } from "@/lib/rate-limit";

/**
 * Mobile sign-in.
 *
 * Only `active` accounts get tokens, but an approved-but-unpaid account is told
 * so explicitly — the app can route them to checkout instead of leaving them at
 * a login screen that looks like their password is wrong.
 */
export async function POST(request: Request) {
  let body: { identifier?: string; password?: string; device?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_body", 400);
  }

  const identifier = body.identifier?.trim();
  const password = body.password;
  if (!identifier || !password) return apiError("missing_credentials", 400);

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const [byIp, byId] = await Promise.all([
    checkRateLimit(`api:login:ip:${ip}`, RATE_LIMITS.login),
    checkRateLimit(`api:login:id:${identifier.toLowerCase()}`, RATE_LIMITS.login),
  ]);
  if (!byIp.ok || !byId.ok) return apiError("rate_limited", 429);

  const account = await authenticate(identifier, password);
  if (!account) return apiError("invalid_credentials", 401);

  if (account.status !== "active") {
    return apiError(
      account.status === "awaiting_payment"
        ? "payment_required"
        : "account_inactive",
      403,
    );
  }

  const [accessToken, refreshToken] = await Promise.all([
    issueAccessToken(account),
    issueRefreshToken({
      accountId: new ObjectId(account.id),
      device: body.device ?? null,
    }),
  ]);

  return NextResponse.json({
    accessToken,
    refreshToken,
    account: accountPayload(account),
  });
}
