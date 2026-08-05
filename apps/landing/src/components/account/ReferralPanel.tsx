"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Gift, Send, Undo2 } from "lucide-react";
import {
  createReferralInvitationAction,
  revokeOwnInvitationAction,
} from "@/app/actions/account";
import {
  REFERRAL_TIERS,
  nextReferralTier,
  type FormState,
} from "@/lib/domain";
import type { InvitationSummary } from "@/lib/admin/invitations";
import { ChipRadio, FormAlert, TextInput } from "@/components/form/Fields";

export function ReferralPanel({
  successfulReferrals,
  freeMonthsEarned,
  invitations,
  canInvite,
}: {
  successfulReferrals: number;
  freeMonthsEarned: number;
  invitations: InvitationSummary[];
  canInvite: boolean;
}) {
  const t = useTranslations("account");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createReferralInvitationAction,
    undefined,
  );

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const next = nextReferralTier(successfulReferrals);
  const target = next?.referrals ?? REFERRAL_TIERS[REFERRAL_TIERS.length - 1].referrals;
  const progress = Math.min(100, (successfulReferrals / target) * 100);

  return (
    <section className="glass-soft rounded-2xl px-6 py-5">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-mist">
        <Gift className="h-4 w-4 text-gold-300" strokeWidth={1.6} />
        {t("referrals.title")}
      </h2>
      <p className="mt-2 text-[13px] leading-[1.65] text-mist-dim">
        {t("referrals.subtitle")}
      </p>

      {/* Progress toward the next reward */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between text-[12.5px]">
          <span className="text-mist">
            {t("referrals.count", { count: successfulReferrals })}
          </span>
          <span className="text-mist-faint">
            {next
              ? t("referrals.next", {
                  remaining: next.referrals - successfulReferrals,
                  months: next.freeMonths,
                })
              : t("referrals.maxed")}
          </span>
        </div>
        <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-200 transition-[width] duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        {freeMonthsEarned > 0 && (
          <p className="mt-2.5 text-[12.5px] text-gold-200">
            {t("referrals.earned", { months: freeMonthsEarned })}
          </p>
        )}
      </div>

      <ul className="mt-5 space-y-1 border-t border-white/6 pt-4 text-[12px] text-mist-faint">
        {REFERRAL_TIERS.map((tier) => (
          <li
            key={tier.referrals}
            className={
              successfulReferrals >= tier.referrals ? "text-teal-300" : undefined
            }
          >
            {t("referrals.tier", {
              referrals: tier.referrals,
              months: tier.freeMonths,
            })}
          </li>
        ))}
      </ul>

      {canInvite ? (
        <form action={formAction} className="mt-6 space-y-4 border-t border-white/6 pt-5">
          <input type="hidden" name="locale" value={locale} />

          <TextInput
            name="email"
            type="email"
            label={t("referrals.email")}
            value={email}
            onChange={setEmail}
            error={
              state?.errors?.email?.[0]
                ? t(`referrals.errors.${state.errors.email[0]}`)
                : undefined
            }
          />

          <ChipRadio
            name="role"
            legend={t("referrals.roleQuestion")}
            options={[
              { value: "member", label: t("referrals.asMember") },
              { value: "partner", label: t("referrals.asPartner") },
            ]}
            selected={role}
            onSelect={setRole}
          />

          {state?.ok ? (
            <p className="rounded-xl border border-teal-400/35 bg-teal-400/10 px-4 py-3 text-[13px] text-teal-300">
              {t("referrals.sent")}
            </p>
          ) : (
            <FormAlert
              message={
                state?.message
                  ? t(`referrals.errors.${state.message}`)
                  : undefined
              }
            />
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-ghost w-full py-2.5 text-[14px]"
          >
            {pending ? (
              t("referrals.sending")
            ) : (
              <>
                <Send className="h-4 w-4" strokeWidth={1.7} />
                {t("referrals.send")}
              </>
            )}
          </button>
          <p className="text-center text-[12px] leading-[1.6] text-mist-faint">
            {t("referrals.reviewNote")}
          </p>
        </form>
      ) : (
        <p className="mt-6 border-t border-white/6 pt-5 text-[12.5px] leading-[1.6] text-mist-faint">
          {t("referrals.needsActive")}
        </p>
      )}

      {invitations.length > 0 && (
        <ul className="mt-5 space-y-2 border-t border-white/6 pt-4">
          {invitations.map((invitation) => (
            <li
              key={invitation.id}
              className="flex items-center gap-3 text-[12.5px]"
            >
              <span className="min-w-0 flex-1 truncate text-mist-dim">
                {invitation.invitedEmail}
              </span>
              <span className="shrink-0 text-mist-faint">
                {t(`referrals.status.${invitation.status}`)}
              </span>
              {invitation.status === "sent" && (
                <form action={revokeOwnInvitationAction}>
                  <input
                    type="hidden"
                    name="invitationId"
                    value={invitation.id}
                  />
                  <button
                    type="submit"
                    aria-label={t("referrals.revoke")}
                    className="rounded-md p-1 text-mist-faint transition-colors hover:text-mist"
                  >
                    <Undo2 className="h-3.5 w-3.5" strokeWidth={1.7} />
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
