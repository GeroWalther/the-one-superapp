import "server-only";
import type { ObjectId } from "mongodb";
import { accounts } from "../db/collections";
import { sendMailSafely } from "../mail/mailer";
import { accountLiveEmail } from "../mail/templates";
import { siteUrl } from "../urls";

/**
 * Sends the app login details the first time an account reaches `active`.
 *
 * Several paths lead there — checkout completing, a subscription update, the
 * pre-launch test bypass — and Stripe may deliver its events more than once or
 * out of order. The `welcomeEmailSentAt` claim is what makes all of that add up
 * to exactly one email: only the caller whose update flips it from unset wins.
 */
export async function sendWelcomeEmailOnce(accountId: ObjectId): Promise<void> {
  const collection = await accounts();

  const account = await collection.findOneAndUpdate(
    // `null` also matches accounts created before this field existed.
    { _id: accountId, status: "active", welcomeEmailSentAt: null },
    { $set: { welcomeEmailSentAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!account) return;

  const sent = await sendMailSafely(
    accountLiveEmail({
      locale: account.locale,
      to: account.email,
      name:
        account.role === "partner"
          ? account.displayName
          : account.displayName.split(" ")[0] || account.displayName,
      username: account.username,
      appUrl: process.env.NEXT_PUBLIC_IOS_APP_URL || null,
      resetUrl: siteUrl(`/${account.locale}/forgot-password`),
    }),
  );

  // Hand the claim back so the next event for this account tries again,
  // rather than a Resend hiccup leaving someone without their login forever.
  if (!sent) {
    await collection.updateOne(
      { _id: accountId },
      { $set: { welcomeEmailSentAt: null } },
    );
  }
}
