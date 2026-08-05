"use server";

import { redirect } from "next/navigation";
import {
  createBillingPortalSession,
  createCheckoutSession,
} from "@/lib/billing/checkout";
import { activateWithoutPayment } from "@/lib/billing/testMode";
import { getCurrentAccount } from "@/lib/auth/dal";
import type { FormState } from "@/lib/domain";
import type { Locale } from "@/lib/db/collections";

function safeLocale(value: FormDataEntryValue | null): Locale {
  return value === "en" ? "en" : "de";
}

export async function startCheckoutAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = safeLocale(formData.get("locale"));
  const account = await getCurrentAccount();
  if (!account) return { message: "notSignedIn" };

  const result = await createCheckoutSession({ account, locale });

  if (!result.ok) {
    return {
      message:
        result.reason === "not_configured"
          ? "billingNotConfigured"
          : result.reason === "already_active"
            ? "alreadyActive"
            : result.reason === "no_plan"
              ? "noPlan"
              : "serverError",
    };
  }

  // Stripe-hosted checkout lives on their domain, so this leaves the app.
  redirect(result.url);
}

/**
 * Test-mode go-live. Re-checks the interlock inside `activateWithoutPayment`
 * rather than trusting the caller — the button's absence from the UI is not a
 * guarantee that nobody posts to this action.
 */
export async function activateWithoutPaymentAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = safeLocale(formData.get("locale"));
  const account = await getCurrentAccount();
  if (!account) return { message: "notSignedIn" };

  const activated = await activateWithoutPayment(account.id);
  if (!activated) return { message: "serverError" };

  redirect(`/${locale}/account?checkout=test`);
}

export async function openBillingPortalAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = safeLocale(formData.get("locale"));
  const account = await getCurrentAccount();
  if (!account) return { message: "notSignedIn" };

  const result = await createBillingPortalSession({ account, locale });

  if (!result.ok) {
    return {
      message:
        result.reason === "not_configured"
          ? "billingNotConfigured"
          : result.reason === "no_customer"
            ? "noCustomer"
            : "serverError",
    };
  }

  redirect(result.url);
}
