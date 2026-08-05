import { SignJWT, jwtVerify } from "jose";

/* This module is deliberately free of `next/headers` so that `proxy.ts` can
   import `decrypt` for its optimistic check without pulling the request-scoped
   cookie APIs into the proxy. Cookie writes live in `session-cookie.ts`. */

export const SESSION_COOKIE = "theone_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  userId: string;
  role: "member" | "partner";
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

    if (typeof payload.userId !== "string") return null;

    return {
      userId: payload.userId,
      role: payload.role === "partner" ? "partner" : "member",
    };
  } catch {
    // Expired, tampered with, or signed by a rotated secret.
    return null;
  }
}
