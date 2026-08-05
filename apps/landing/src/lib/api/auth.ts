import "server-only";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { SignJWT, jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { keyedHash, refreshTokens } from "../db/collections";
import { findAccountById, type PublicAccount } from "../auth/accounts";
import { ROLES, type Role } from "../domain";

/**
 * Token auth for the iOS app.
 *
 * Deliberately not the web session cookie: a native client has no cookie jar
 * worth relying on, and a revocable refresh token lets someone sign a lost
 * phone out from another device without invalidating every other session.
 *
 * Access tokens are short-lived and stateless; refresh tokens are long-lived,
 * stored hashed, and revocable.
 */

const ACCESS_TTL_SECONDS = 60 * 15; // 15 minutes
export const REFRESH_TTL_DAYS = 60;

function encodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set.");
  return new TextEncoder().encode(secret);
}

export async function issueAccessToken(account: PublicAccount): Promise<string> {
  return new SignJWT({ accountId: account.id, role: account.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setAudience("theone-mobile")
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(encodedKey());
}

async function verifyAccessToken(
  token: string,
): Promise<{ accountId: string; role: Role } | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey(), {
      algorithms: ["HS256"],
      // Without this, a web session cookie would authenticate against the API.
      audience: "theone-mobile",
    });
    if (typeof payload.accountId !== "string") return null;
    if (!ROLES.includes(payload.role as Role)) return null;
    return { accountId: payload.accountId, role: payload.role as Role };
  } catch {
    return null;
  }
}

export async function issueRefreshToken(input: {
  accountId: ObjectId;
  device?: string | null;
}): Promise<string> {
  const raw = randomBytes(48).toString("base64url");
  const collection = await refreshTokens();

  await collection.insertOne({
    _id: new ObjectId(),
    accountId: input.accountId,
    tokenHash: keyedHash(raw),
    device: input.device ?? null,
    revokedAt: null,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
  });

  return raw;
}

/**
 * Exchanges a refresh token for a new pair, rotating the old one out.
 *
 * Rotation matters: a stolen refresh token is only useful until the real client
 * next refreshes, at which point the thief's copy is already revoked.
 */
export async function rotateRefreshToken(
  raw: string,
): Promise<{ account: PublicAccount; refreshToken: string } | null> {
  const collection = await refreshTokens();

  const existing = await collection.findOneAndUpdate(
    { tokenHash: keyedHash(raw), revokedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { revokedAt: new Date() } },
  );

  if (!existing) return null;

  const account = await findAccountById(existing.accountId.toHexString());
  if (!account || account.status !== "active") return null;

  const refreshToken = await issueRefreshToken({
    accountId: existing.accountId,
    device: existing.device,
  });

  return { account, refreshToken };
}

export async function revokeRefreshToken(raw: string): Promise<void> {
  const collection = await refreshTokens();
  await collection.updateOne(
    { tokenHash: keyedHash(raw) },
    { $set: { revokedAt: new Date() } },
  );
}

export async function revokeAllRefreshTokens(
  accountId: ObjectId,
): Promise<void> {
  const collection = await refreshTokens();
  await collection.updateMany(
    { accountId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

/* ========================================================================== *
 * Request authentication
 * ========================================================================== */

export type ApiError = { error: string; code: string };

export function apiError(
  code: string,
  status: number,
  message?: string,
): NextResponse<ApiError> {
  return NextResponse.json({ error: message ?? code, code }, { status });
}

/**
 * Resolves the caller, or returns the response to send back.
 *
 * Only `active` accounts pass. An approved-but-unpaid account gets a distinct
 * code so the app can send them to checkout rather than showing a generic
 * "wrong password" dead end.
 */
export async function authenticateRequest(
  request: Request,
): Promise<
  { ok: true; account: PublicAccount } | { ok: false; response: NextResponse }
> {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) {
    return { ok: false, response: apiError("missing_token", 401) };
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return { ok: false, response: apiError("invalid_token", 401) };
  }

  const account = await findAccountById(payload.accountId);
  if (!account) {
    return { ok: false, response: apiError("account_not_found", 401) };
  }

  if (account.status !== "active") {
    return {
      ok: false,
      response: apiError(
        account.status === "awaiting_payment"
          ? "payment_required"
          : "account_inactive",
        403,
      ),
    };
  }

  return { ok: true, account };
}

export function accountPayload(account: PublicAccount) {
  return {
    id: account.id,
    role: account.role,
    username: account.username,
    email: account.email,
    displayName: account.displayName,
    firstName: account.firstName,
    locale: account.locale,
    status: account.status,
    successfulReferrals: account.successfulReferrals,
    freeMonthsGranted: account.freeMonthsGranted,
  };
}
