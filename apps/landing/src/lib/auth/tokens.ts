import "server-only";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { authTokens, keyedHash, type AuthTokenDoc } from "../db/collections";

/**
 * Single-use, expiring tokens for activation links and password resets.
 *
 * Only the hash is stored. A leaked database dump therefore cannot be used to
 * take over pending accounts, and the raw token exists exactly once — in the
 * email we just sent.
 */

export const ACTIVATION_TTL_DAYS = 14;
export const PASSWORD_RESET_TTL_MINUTES = 60;

function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function issueToken(input: {
  purpose: AuthTokenDoc["purpose"];
  applicationId?: ObjectId | null;
  accountId?: ObjectId | null;
  ttlMs: number;
}): Promise<string> {
  const raw = newToken();
  const collection = await authTokens();

  await collection.insertOne({
    _id: new ObjectId(),
    tokenHash: keyedHash(raw),
    purpose: input.purpose,
    applicationId: input.applicationId ?? null,
    accountId: input.accountId ?? null,
    usedAt: null,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + input.ttlMs),
  });

  return raw;
}

/** Reads a token without spending it — for rendering the form before submit. */
export async function peekToken(
  raw: string,
  purpose: AuthTokenDoc["purpose"],
): Promise<AuthTokenDoc | null> {
  const collection = await authTokens();
  const doc = await collection.findOne({ tokenHash: keyedHash(raw), purpose });

  if (!doc || doc.usedAt || doc.expiresAt <= new Date()) return null;
  return doc;
}

/**
 * Spends the token. The `usedAt: null` filter is what makes this single-use:
 * two concurrent submissions race on the same document and exactly one wins.
 */
export async function consumeToken(
  raw: string,
  purpose: AuthTokenDoc["purpose"],
): Promise<AuthTokenDoc | null> {
  const collection = await authTokens();

  const doc = await collection.findOneAndUpdate(
    {
      tokenHash: keyedHash(raw),
      purpose,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { usedAt: new Date() } },
    { returnDocument: "after" },
  );

  return doc ?? null;
}

/** Invalidates every outstanding token of a purpose — used after a password change. */
export async function revokeTokensFor(
  accountId: ObjectId,
  purpose: AuthTokenDoc["purpose"],
): Promise<void> {
  const collection = await authTokens();
  await collection.updateMany(
    { accountId, purpose, usedAt: null },
    { $set: { usedAt: new Date() } },
  );
}
