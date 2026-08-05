"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CreditCard, ExternalLink } from "lucide-react";
import {
  openBillingPortalAction,
  startCheckoutAction,
} from "@/app/actions/billing";
import type { AccountStatus, FormState } from "@/lib/domain";
import { FormAlert } from "@/components/form/Fields";

export function BillingPanel({
  status,
  planLabel,
  priceLabel,
  freeMonths,
  hasCustomer,
}: {
  status: AccountStatus;
  planLabel: string | null;
  priceLabel: string | null;
  freeMonths: number;
  hasCustomer: boolean;
}) {
  const t = useTranslations("account");
  const locale = useLocale();

  const [checkoutState, checkoutAction, checkingOut] = useActionState<
    FormState,
    FormData
  >(startCheckoutAction, undefined);
  const [portalState, portalAction, openingPortal] = useActionState<
    FormState,
    FormData
  >(openBillingPortalAction, undefined);

  const needsPayment = status === "awaiting_payment" || status === "canceled";

  return (
    <section className="glass-soft rounded-2xl px-6 py-5">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <CreditCard className="h-4 w-4 text-aqua-500" strokeWidth={1.6} />
        {t("billing.title")}
      </h2>

      {planLabel && (
        <p className="mt-3 text-[14px] text-ink">
          {planLabel}
          {priceLabel && (
            <span className="text-ink-soft"> — {priceLabel}</span>
          )}
        </p>
      )}

      {freeMonths > 0 && needsPayment && (
        <p className="mt-3 rounded-xl border border-aqua-500/30 bg-aqua-500/10 px-4 py-3 text-[13px] leading-[1.6] text-aqua-700">
          {t("billing.trialNote", { months: freeMonths })}
        </p>
      )}

      {status === "past_due" && (
        <p className="mt-3 rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-[13px] leading-[1.6] text-destructive">
          {t("billing.pastDue")}
        </p>
      )}

      {needsPayment ? (
        <form action={checkoutAction} className="mt-5">
          <input type="hidden" name="locale" value={locale} />
          <FormAlert
            message={
              checkoutState?.message
                ? t(`billing.errors.${checkoutState.message}`)
                : undefined
            }
          />
          <button
            type="submit"
            disabled={checkingOut}
            className="btn btn-primary w-full py-2.5 text-[14px]"
          >
            {checkingOut ? t("billing.working") : t("billing.startCheckout")}
          </button>
          <p className="mt-3 text-center text-[12px] text-ink-faint">
            {t("billing.stripeNote")}
          </p>
        </form>
      ) : (
        <form action={portalAction} className="mt-5">
          <input type="hidden" name="locale" value={locale} />
          <FormAlert
            message={
              portalState?.message
                ? t(`billing.errors.${portalState.message}`)
                : undefined
            }
          />
          <button
            type="submit"
            disabled={openingPortal || !hasCustomer}
            className="btn btn-ghost w-full py-2.5 text-[14px]"
          >
            {openingPortal ? t("billing.working") : t("billing.managePlan")}
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.7} />
          </button>
          <p className="mt-3 text-center text-[12px] leading-[1.6] text-ink-faint">
            {t("billing.portalNote")}
          </p>
        </form>
      )}
    </section>
  );
}
