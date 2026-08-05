import "server-only";
import { ObjectId } from "mongodb";
import { accounts } from "../db/collections";
import { freeMonthsForReferrals } from "../domain";
import { recordEntitlement } from "../auth/activation";
import { sendMailSafely } from "../mail/mailer";
import { referralRewardEmail } from "../mail/templates";
import { addMonths } from "./checkout";
import { stripe } from "./stripe";

/**
 * Referral rewards.
 *
 * A referral is only worth anything once the invitee's account actually goes
 * `active`. Crediting at signup would let anyone mint free months with
 * throwaway addresses, so this is called from the Stripe webhook and nowhere
 * else.
 */
export async function creditReferrerFor(inviteeId: ObjectId): Promise<void> {
  try {
    const collection = await accounts();

    /* Claim the credit atomically. The `referralCreditedAt: null` filter is
       what makes a replayed webhook — or two events arriving together —
       produce exactly one reward. */
    const invitee = await collection.findOneAndUpdate(
      { _id: inviteeId, referralCreditedAt: null, invitedByAccountId: { $ne: null } },
      { $set: { referralCreditedAt: new Date() } },
      { returnDocument: "after" },
    );

    if (!invitee?.invitedByAccountId) return;

    const referrer = await collection.findOneAndUpdate(
      { _id: invitee.invitedByAccountId },
      { $inc: { successfulReferrals: 1 }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" },
    );

    if (!referrer) return;

    const earned = freeMonthsForReferrals(referrer.successfulReferrals);
    const alreadyGranted = referrer.referralFreeMonthsGranted;

    // Tiers are thresholds, not increments: reaching 8 means six months in
    // total, so only the difference is granted.
    const delta = earned - alreadyGranted;
    if (delta <= 0) return;

    await collection.updateOne(
      { _id: referrer._id },
      {
        $inc: { freeMonthsGranted: delta },
        $set: { referralFreeMonthsGranted: earned, updatedAt: new Date() },
      },
    );

    await recordEntitlement({
      accountId: referrer._id,
      freeMonths: delta,
      reason: "referral_tier",
      detail: `Reached ${referrer.successfulReferrals} successful referrals`,
      referralCount: referrer.successfulReferrals,
    });

    await extendTrial(referrer._id, delta);

    await sendMailSafely(
      referralRewardEmail({
        locale: referrer.locale,
        to: referrer.email,
        name: referrer.displayName.split(" ")[0] || referrer.displayName,
        referrals: referrer.successfulReferrals,
        totalFreeMonths: earned,
        addedFreeMonths: delta,
      }),
    );
  } catch (error) {
    console.error("[referrals] crediting failed:", error);
  }
}

/**
 * Pushes an existing subscription's trial out by the granted months.
 *
 * Extending the trial moves the next invoice rather than issuing a refund,
 * which keeps the reward off the books as a credit note and off the
 * subscriber's statement as a confusing charge-then-refund pair.
 */
async function extendTrial(accountId: ObjectId, months: number): Promise<void> {
  const client = stripe();
  if (!client) return;

  const collection = await accounts();
  const account = await collection.findOne({ _id: accountId });
  if (!account?.stripeSubscriptionId) return;

  try {
    const subscription = await client.subscriptions.retrieve(
      account.stripeSubscriptionId,
    );

    const base =
      subscription.trial_end && subscription.trial_end * 1000 > Date.now()
        ? new Date(subscription.trial_end * 1000)
        : new Date();

    const trialEnd = Math.floor(addMonths(base, months).getTime() / 1000);

    await client.subscriptions.update(account.stripeSubscriptionId, {
      trial_end: trialEnd,
      proration_behavior: "none",
    });

    await collection.updateOne(
      { _id: accountId },
      { $set: { freeUntil: new Date(trialEnd * 1000), updatedAt: new Date() } },
    );
  } catch (error) {
    console.error("[referrals] trial extension failed:", error);
  }
}
