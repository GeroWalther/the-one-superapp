import "server-only";
import Stripe from "stripe";
import { PLANS, type Plan } from "../domain";

/**
 * Stripe access.
 *
 * Absent keys are a first-class state rather than a crash: the rest of the
 * platform is fully usable without billing configured, and every entry point
 * checks `isBillingConfigured()` so the failure is an explicit message instead
 * of a stack trace.
 */

let client: Stripe | null | undefined;

export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe(): Stripe | null {
  if (client !== undefined) return client;

  const key = process.env.STRIPE_SECRET_KEY;
  client = key
    ? new Stripe(key, {
        // Pinned deliberately: an unpinned version means Stripe can change
        // response shapes under a deployment that has not been retested.
        apiVersion: "2026-07-29.dahlia",
        appInfo: { name: "TheONE", version: "1.0.0" },
      })
    : null;

  return client;
}

/**
 * Finds or creates the Price for a plan, keyed by `lookup_key`.
 *
 * Idempotent by design — running it twice returns the same price rather than
 * creating a duplicate, so a redeploy never splits customers across two prices
 * for the same product.
 */
export async function ensurePrice(plan: Plan): Promise<string | null> {
  const client = stripe();
  if (!client) return null;

  const lookupKey = `theone_${plan.key}`;

  const existing = await client.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0].id;

  const products = await client.products.search({
    query: `metadata['theone_plan']:'${plan.key}'`,
    limit: 1,
  });

  const product =
    products.data[0] ??
    (await client.products.create({
      name: `TheONE — ${plan.label}`,
      metadata: { theone_plan: plan.key },
    }));

  const price = await client.prices.create({
    product: product.id,
    unit_amount: plan.amountCents,
    currency: plan.currency,
    recurring: { interval: plan.interval },
    lookup_key: lookupKey,
    metadata: { theone_plan: plan.key },
  });

  return price.id;
}

/** Creates every plan's price. Safe to call repeatedly. */
export async function ensureAllPrices(): Promise<Record<string, string | null>> {
  const entries = await Promise.all(
    Object.values(PLANS).map(async (plan) => [plan.key, await ensurePrice(plan)] as const),
  );
  return Object.fromEntries(entries);
}
