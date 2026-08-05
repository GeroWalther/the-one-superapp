import "server-only";
import { ObjectId } from "mongodb";
import { accounts } from "../db/collections";
import { creditReferrerFor } from "./referrals";

/**
 * A payment bypass for pre-launch testing, so the whole loop — apply, get
 * approved, choose credentials, go live — can be walked before Stripe keys
 * exist.
 *
 * The interlock is deliberately not "trust the flag". A configured
 * `STRIPE_SECRET_KEY` disables the bypass outright, so the moment this
 * deployment can take real money it can no longer be talked into handing out
 * free accounts, whatever `ALLOW_TEST_ACTIVATION` happens to say. Forgetting to
 * remove the flag at launch is the likely mistake, and this makes that mistake
 * harmless.
 */
export function isTestActivationEnabled(): boolean {
  if (process.env.STRIPE_SECRET_KEY) return false;
  return process.env.ALLOW_TEST_ACTIVATION === "1";
}

export async function activateWithoutPayment(
  accountId: string,
): Promise<boolean> {
  if (!isTestActivationEnabled()) return false;
  if (!ObjectId.isValid(accountId)) return false;

  const id = new ObjectId(accountId);
  const collection = await accounts();

  /* `status: { $ne: "active" }` is the concurrency guard, mirroring the webhook:
     a double click must credit the referrer once, not twice. */
  const result = await collection.updateOne(
    { _id: id, status: { $ne: "active" } },
    {
      $set: {
        status: "active",
        /* Flagged so these stay findable. An account that never paid must never
           be indistinguishable from one that did — not in support, and not in
           whatever revenue figure someone eventually counts out of this
           collection. */
        activatedWithoutPayment: true,
        updatedAt: new Date(),
      },
    },
  );

  if (result.matchedCount === 0) return false;

  // Going live is what earns the referrer their free months, exactly as in the
  // real webhook path.
  await creditReferrerFor(id);
  return true;
}
