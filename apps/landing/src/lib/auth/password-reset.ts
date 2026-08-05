import "server-only";
import { ObjectId } from "mongodb";
import { accounts } from "../db/collections";
import { normaliseEmail } from "../domain";
import { setPassword } from "./accounts";
import {
  PASSWORD_RESET_TTL_MINUTES,
  consumeToken,
  issueToken,
  peekToken,
  revokeTokensFor,
} from "./tokens";
import { sendMailSafely } from "../mail/mailer";
import { passwordResetEmail } from "../mail/templates";
import { siteUrl } from "../urls";

/**
 * Password reset.
 *
 * Requesting a reset always reports success, whether or not the address exists.
 * Anything else turns the form into a membership checker — and for a platform
 * whose whole proposition is discretion, confirming who is a member is a real
 * leak, not a theoretical one.
 */
export async function requestPasswordReset(input: {
  email: string;
  locale: "de" | "en";
}): Promise<void> {
  try {
    const email = normaliseEmail(input.email);
    const collection = await accounts();
    const account = await collection.findOne({ email });

    if (!account) return;
    if (account.status === "suspended") return;

    const raw = await issueToken({
      purpose: "password_reset",
      accountId: account._id,
      ttlMs: PASSWORD_RESET_TTL_MINUTES * 60 * 1000,
    });

    await sendMailSafely(
      passwordResetEmail({
        locale: account.locale,
        to: account.email,
        resetUrl: siteUrl(
          `/${account.locale}/reset-password?token=${encodeURIComponent(raw)}`,
        ),
        expiresInMinutes: PASSWORD_RESET_TTL_MINUTES,
      }),
    );
  } catch (error) {
    // Swallowed on purpose: the caller reports success either way, so a
    // failure here must not become a timing or error-shape signal.
    console.error("[password-reset] request failed:", error);
  }
}

export async function isResetTokenValid(raw: string): Promise<boolean> {
  const token = await peekToken(raw, "password_reset");
  return Boolean(token?.accountId);
}

export type ResetOutcome = { ok: true } | { ok: false; reason: "invalid_token" | "error" };

export async function completePasswordReset(input: {
  token: string;
  password: string;
}): Promise<ResetOutcome> {
  try {
    const token = await consumeToken(input.token, "password_reset");
    if (!token?.accountId) return { ok: false, reason: "invalid_token" };

    await setPassword(token.accountId, input.password);

    // Any other outstanding reset link is now stale — if the request was
    // triggered by someone else, this closes their window too.
    await revokeTokensFor(token.accountId, "password_reset");

    return { ok: true };
  } catch (error) {
    console.error("[password-reset] completion failed:", error);
    return { ok: false, reason: "error" };
  }
}

export type { ObjectId };
