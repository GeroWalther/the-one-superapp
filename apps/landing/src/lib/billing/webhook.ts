import "server-only";
import { ObjectId } from "mongodb";
import type Stripe from "stripe";
import { accounts } from "../db/collections";
import { getDb } from "../mongodb";
import type { AccountStatus } from "../domain";
import { creditReferrerFor } from "./referrals";
import { stripe } from "./stripe";

/**
 * Stripe is the authority on subscription state. Nothing else in the codebase
 * writes `active`, `past_due`, or `canceled` — those transitions arrive here or
 * not at all.
 */

/** Events are replayed by Stripe on retry, so each one is processed once. */
async function claimEvent(eventId: string): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection<{ _id: string; createdAt: Date }>(
    "stripeEvents",
  );

  await collection.createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 30 },
  );

  try {
    await collection.insertOne({ _id: eventId, createdAt: new Date() });
    return true;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return false; // already handled
    }
    throw error;
  }
}

export function verifyWebhook(
  rawBody: string,
  signature: string | null,
): Stripe.Event | null {
  const client = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!client || !secret || !signature) return null;

  try {
    return client.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    // An unverifiable payload is either a misconfiguration or a forgery.
    // Either way it must never reach the state machine below.
    console.error("[stripe] signature verification failed:", error);
    return null;
  }
}

function accountIdFrom(
  object: { metadata?: Stripe.Metadata | null; client_reference_id?: string | null },
): ObjectId | null {
  const raw =
    object.metadata?.theone_account ?? object.client_reference_id ?? null;
  return raw && ObjectId.isValid(raw) ? new ObjectId(raw) : null;
}

async function setStatus(
  accountId: ObjectId,
  status: AccountStatus,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const collection = await accounts();
  await collection.updateOne(
    { _id: accountId },
    { $set: { status, updatedAt: new Date(), ...extra } },
  );
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  if (!(await claimEvent(event.id))) return;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const accountId = accountIdFrom(session);
      if (!accountId) break;

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription?.id ?? null);

      await setStatus(accountId, "active", {
        stripeSubscriptionId: subscriptionId,
        ...(typeof session.customer === "string"
          ? { stripeCustomerId: session.customer }
          : {}),
      });

      // The invitee is live, so their referrer has earned something.
      await creditReferrerFor(accountId);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const accountId = accountIdFrom(subscription);
      if (!accountId) break;

      /* Stripe's `status` is richer than ours; map rather than mirror.
         `trialing` is a paying-in-future customer with full access, so it is
         `active` here — treating it as unpaid would lock out every invited
         member for their entire free year. */
      const status: AccountStatus =
        subscription.status === "active" || subscription.status === "trialing"
          ? "active"
          : subscription.status === "past_due" ||
              subscription.status === "unpaid"
            ? "past_due"
            : subscription.status === "canceled" ||
                subscription.status === "incomplete_expired"
              ? "canceled"
              : "awaiting_payment";

      const item = subscription.items.data[0];
      await setStatus(accountId, status, {
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd: item?.current_period_end
          ? new Date(item.current_period_end * 1000)
          : null,
        freeUntil: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const accountId = accountIdFrom(event.data.object);
      if (accountId) await setStatus(accountId, "canceled");
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : null;
      if (!customerId) break;

      const collection = await accounts();
      const account = await collection.findOne({ stripeCustomerId: customerId });
      if (account) await setStatus(account._id, "past_due");
      break;
    }

    default:
      // Unhandled event types are acknowledged, not errored — Stripe retries
      // anything we reject, and a 500 loop on an event we do not care about
      // buries the ones we do.
      break;
  }
}
