import "server-only";
import { ObjectId } from "mongodb";
import { accounts } from "../db/collections";
import { planFor } from "../domain";
import type { PublicAccount } from "../auth/accounts";
import { siteUrl } from "../urls";
import { ensureIntroCoupon, ensurePrice, isBillingConfigured, stripe } from "./stripe";

/**
 * Checkout and the billing portal.
 *
 * Free months are expressed to Stripe as a trial that ends N calendar months
 * from now, not as `trial_period_days`. Twelve "months" of 30 days is eleven
 * months and change — close enough to look like a bug to whoever is charged
 * early, and a support ticket we do not need.
 */

export function addMonths(from: Date, months: number): Date {
  const result = new Date(from);
  const targetMonth = result.getUTCMonth() + months;
  result.setUTCMonth(targetMonth);

  // 31 January + 1 month overflows into March; clamp back to the month end.
  if (result.getUTCMonth() !== ((targetMonth % 12) + 12) % 12) {
    result.setUTCDate(0);
  }

  return result;
}

/** The client's wording for the member welcome offer, shown above the pay button. */
const INTRO_TERMS = {
  de: "Dein erster Monat für 10 €. Danach regulär 49 € pro Monat. Die Mitgliedschaft verlängert sich automatisch und ist monatlich kündbar.",
  en: "Your first month for €10. Then €49 per month as usual. The membership renews automatically and can be cancelled monthly.",
} as const;

export type CheckoutOutcome =
  | { ok: true; url: string }
  | {
      ok: false;
      reason: "not_configured" | "no_plan" | "already_active" | "error";
    };

export async function createCheckoutSession(input: {
  account: PublicAccount;
  locale: "de" | "en";
}): Promise<CheckoutOutcome> {
  const { account, locale } = input;

  if (!isBillingConfigured()) return { ok: false, reason: "not_configured" };
  if (account.status === "active") return { ok: false, reason: "already_active" };

  const plan = planFor(account.role, account.partnerTier, account.earlyAccess);
  if (!plan) return { ok: false, reason: "no_plan" };

  const client = stripe();
  if (!client) return { ok: false, reason: "not_configured" };

  try {
    const priceId = await ensurePrice(plan);
    if (!priceId) return { ok: false, reason: "error" };

    let customerId = account.stripeCustomerId;
    if (!customerId) {
      const customer = await client.customers.create({
        email: account.email,
        name: account.displayName,
        metadata: { theone_account: account.id },
      });
      customerId = customer.id;

      await (
        await accounts()
      ).updateOne(
        { _id: new ObjectId(account.id) },
        { $set: { stripeCustomerId: customerId, updatedAt: new Date() } },
      );
    }

    /* Stripe rejects a trial ending less than 48 hours out, so a token grant of
       a day or two is dropped rather than failing the whole checkout. */
    const trialEnd =
      account.freeMonthsGranted > 0
        ? Math.floor(addMonths(new Date(), account.freeMonthsGranted).getTime() / 1000)
        : undefined;
    const trialIsUsable =
      trialEnd !== undefined && trialEnd * 1000 - Date.now() > 48 * 60 * 60 * 1000;

    /* The welcome price only where the first invoice is a real charge: after a
       free-month trial the first invoice is €0 and the discount would be spent
       on nothing. Stripe refuses a fixed discount alongside the promo-code
       field, so a checkout has one or the other. */
    const introCoupon = trialIsUsable ? null : await ensureIntroCoupon(plan);

    const session = await client.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: account.id,
      subscription_data: {
        ...(trialIsUsable ? { trial_end: trialEnd } : {}),
        metadata: { theone_account: account.id },
      },
      metadata: { theone_account: account.id },
      success_url: siteUrl(`/${locale}/account?checkout=success`),
      cancel_url: siteUrl(`/${locale}/account?checkout=cancelled`),
      locale: locale === "de" ? "de" : "en",
      /* TheONE is the seller, not Stripe's Link: Managed Payments would put
         "LINK.COM*" in front of our name on every bank statement. VAT is
         worked out by Stripe Tax instead; prices include it. */
      managed_payments: { enabled: false },
      automatic_tax: { enabled: true },
      // Stripe Tax needs the buyer's address on the customer it bills.
      customer_update: { address: "auto", name: "auto" },
      // Businesses can enter a VAT number (reverse charge within the EU).
      tax_id_collection: { enabled: true },
      ...(introCoupon
        ? {
            discounts: [{ coupon: introCoupon }],
            custom_text: { submit: { message: INTRO_TERMS[locale] } },
          }
        : { allow_promotion_codes: true }),
    });

    if (!session.url) return { ok: false, reason: "error" };
    return { ok: true, url: session.url };
  } catch (error) {
    console.error("[billing] checkout failed:", error);
    return { ok: false, reason: "error" };
  }
}

export type PortalOutcome =
  | { ok: true; url: string }
  | { ok: false; reason: "not_configured" | "no_customer" | "error" };

export async function createBillingPortalSession(input: {
  account: PublicAccount;
  locale: "de" | "en";
}): Promise<PortalOutcome> {
  const client = stripe();
  if (!client) return { ok: false, reason: "not_configured" };
  if (!input.account.stripeCustomerId) {
    return { ok: false, reason: "no_customer" };
  }

  try {
    const session = await client.billingPortal.sessions.create({
      customer: input.account.stripeCustomerId,
      return_url: siteUrl(`/${input.locale}/account`),
      locale: input.locale === "de" ? "de" : "en",
    });
    return { ok: true, url: session.url };
  } catch (error) {
    console.error("[billing] portal failed:", error);
    return { ok: false, reason: "error" };
  }
}
