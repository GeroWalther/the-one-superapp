"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import {
  approveApplicationAction,
  declineApplicationAction,
} from "@/app/actions/admin";
import { PARTNER_TIERS, PLANS, type FormState } from "@/lib/domain";
import { ChipRadio, ErrorText, FormAlert, TextArea } from "@/components/form/Fields";

const TIER_PLAN = {
  large: PLANS.partnerLarge,
  small: PLANS.partnerSmall,
} as const;

export function DecisionPanel({
  applicationId,
  type,
}: {
  applicationId: string;
  type: "member" | "partner";
}) {
  const t = useTranslations("admin");
  const [tab, setTab] = useState<"approve" | "decline">("approve");

  const [approveState, approveAction, approving] = useActionState<
    FormState,
    FormData
  >(approveApplicationAction, undefined);
  const [declineState, declineAction, declining] = useActionState<
    FormState,
    FormData
  >(declineApplicationAction, undefined);

  const [tier, setTier] = useState("");
  const [internalReason, setInternalReason] = useState("");
  const [applicantMessage, setApplicantMessage] = useState("");

  const done =
    approveState?.ok === true || declineState?.ok === true;

  if (done) {
    const approved = approveState?.ok === true;
    return (
      <div
        className={`rounded-2xl border px-6 py-5 ${
          approved
            ? "border-teal-400/40 bg-teal-400/10"
            : "border-white/12 bg-white/5"
        }`}
      >
        <p className="text-[14px] font-medium text-mist">
          {approved ? t("decision.approvedDone") : t("decision.declinedDone")}
        </p>
        <p className="mt-1.5 text-[13px] text-mist-dim">
          {approved
            ? t("decision.approvedDoneNote")
            : t("decision.declinedDoneNote")}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-soft rounded-2xl p-6">
      <h2 className="text-[15px] font-semibold text-mist">
        {t("decision.title")}
      </h2>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("approve")}
          data-selected={tab === "approve"}
          className="chip"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2} />
          {t("decision.approve")}
        </button>
        <button
          type="button"
          onClick={() => setTab("decline")}
          data-selected={tab === "decline"}
          className="chip"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
          {t("decision.decline")}
        </button>
      </div>

      {tab === "approve" ? (
        <form action={approveAction} className="mt-6 space-y-5">
          <input type="hidden" name="applicationId" value={applicationId} />
          <input type="hidden" name="type" value={type} />

          {type === "partner" ? (
            <div>
              <ChipRadio
                name="partnerTier"
                legend={t("decision.tierQuestion")}
                hint={t("decision.tierHint")}
                options={PARTNER_TIERS.map((value) => ({
                  value,
                  label: `${t(`tier.${value}`)} — €${(
                    TIER_PLAN[value].amountCents / 100
                  ).toLocaleString("de-DE")}/${t("decision.perYear")}`,
                }))}
                selected={tier}
                onSelect={setTier}
              />
              <ErrorText
                error={
                  approveState?.errors?.partnerTier?.[0]
                    ? t(`errors.${approveState.errors.partnerTier[0]}`)
                    : undefined
                }
              />
            </div>
          ) : (
            <p className="text-[13px] leading-[1.7] text-mist-dim">
              {t("decision.memberPlanNote", {
                price: (PLANS.member.amountCents / 100).toString(),
              })}
            </p>
          )}

          <FormAlert
            message={
              approveState?.message && !approveState.ok
                ? t(`errors.${approveState.message}`)
                : undefined
            }
          />

          <button
            type="submit"
            disabled={approving}
            className="btn btn-gold w-full py-2.5 text-[14px]"
          >
            {approving ? t("decision.working") : t("decision.approveConfirm")}
          </button>
          <p className="text-center text-[12px] text-mist-faint">
            {t("decision.approveNote")}
          </p>
        </form>
      ) : (
        <form action={declineAction} className="mt-6 space-y-5">
          <input type="hidden" name="applicationId" value={applicationId} />

          <TextArea
            name="internalReason"
            label={t("decision.internalReason")}
            hint={t("decision.internalReasonHint")}
            rows={3}
            value={internalReason}
            onChange={setInternalReason}
            error={
              declineState?.errors?.internalReason?.[0]
                ? t(`errors.${declineState.errors.internalReason[0]}`)
                : undefined
            }
          />

          <TextArea
            name="applicantMessage"
            label={t("decision.applicantMessage")}
            hint={t("decision.applicantMessageHint")}
            rows={3}
            value={applicantMessage}
            onChange={setApplicantMessage}
          />

          <FormAlert
            message={
              declineState?.message && !declineState.ok
                ? t(`errors.${declineState.message}`)
                : undefined
            }
          />

          <button
            type="submit"
            disabled={declining}
            className="btn btn-ghost w-full py-2.5 text-[14px]"
          >
            {declining ? t("decision.working") : t("decision.declineConfirm")}
          </button>
          <p className="text-center text-[12px] leading-[1.6] text-destructive/80">
            {t("decision.declineWarning")}
          </p>
        </form>
      )}
    </div>
  );
}
