import "server-only";
import { headers } from "next/headers";
import { getDb } from "./mongodb";

/**
 * Fixed-window rate limiting backed by MongoDB.
 *
 * An in-memory counter would be useless here: each serverless instance keeps
 * its own memory, so an attacker spreading requests across warm lambdas would
 * see the limit multiply by the number of instances. A shared counter in the
 * database is the only version that actually holds.
 *
 * Documents expire via a TTL index, so the collection self-cleans.
 */

type RateLimitDoc = {
  _id: string;
  count: number;
  expiresAt: Date;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

let indexReady: Promise<void> | undefined;

async function collection() {
  const db = await getDb();
  const rateLimits = db.collection<RateLimitDoc>("rateLimits");

  indexReady ??= rateLimits
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    .then(() => undefined);
  await indexReady;

  return rateLimits;
}

export async function checkRateLimit(
  key: string,
  options: { limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const { limit, windowSeconds } = options;
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSeconds * 1000));
  const expiresAt = new Date((windowStart + 1) * windowSeconds * 1000);

  try {
    const rateLimits = await collection();
    const doc = await rateLimits.findOneAndUpdate(
      { _id: `${key}:${windowStart}` },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, returnDocument: "after" },
    );

    const count = doc?.count ?? 1;
    const ok = count <= limit;

    return {
      ok,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: ok
        ? 0
        : Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)),
    };
  } catch (error) {
    // Fail open. A database hiccup should not make the enrolment form
    // unusable for legitimate applicants; the DAL already fails closed on the
    // things that actually matter for security.
    console.error("[rate-limit] check failed, allowing request:", error);
    return { ok: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/**
 * Best-effort client identity for rate-limit keys. On Vercel the leftmost entry
 * of `x-forwarded-for` is the real client; the header is spoofable in general,
 * which is why limits are paired with per-email limits rather than trusted alone.
 */
export async function clientKey(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  return ip;
}

/** Limits tuned per action — enrolment is heavier than a login attempt. */
export const RATE_LIMITS = {
  application: { limit: 5, windowSeconds: 60 * 60 },
  login: { limit: 10, windowSeconds: 15 * 60 },
  passwordReset: { limit: 5, windowSeconds: 60 * 60 },
  invitation: { limit: 20, windowSeconds: 60 * 60 },
} as const;
