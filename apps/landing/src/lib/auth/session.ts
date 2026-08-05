import { SignJWT, jwtVerify } from "jose";
import { ROLES, type Role } from "../domain";

/**
 * Web session tokens. Free of `next/headers` so anything outside a request
 * scope can verify one; cookie writes live in `session-cookie.ts`.
 */

export const SESSION_COOKIE = "theone_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  accountId: string;
  role: Role;
};

function encodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Generate one with `openssl rand -base64 32`.",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(encodedKey());
}

export async function decrypt(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, encodedKey(), {
      algorithms: ["HS256"],
    });

    if (typeof payload.accountId !== "string") return null;
    // An unrecognised role must be rejected outright rather than quietly
    // degraded to a valid one.
    if (!ROLES.includes(payload.role as Role)) return null;

    return { accountId: payload.accountId, role: payload.role as Role };
  } catch {
    // Expired, tampered with, or signed by a rotated secret.
    return null;
  }
}
