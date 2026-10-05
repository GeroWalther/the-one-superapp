"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { setEarlyAccessAction } from "@/app/actions/admin";
import type { FormState } from "@/lib/domain";
import { FormAlert } from "@/components/form/Fields";

/** Switches an approved, not-yet-paying applicant between Standard and Early Access. */
export function PlanPanel({
  applicationId,
  earlyAccess,
  standardLabel,
  earlyLabel,
}: {
  applicationId: string;
  earlyAccess: boolean;
  standardLabel: string;
  earlyLabel: string;
}) {
  const t = useTranslations("admin");
  const [state, action, working] = useActionState<FormState, FormData>(
    setEarlyAccessAction,
    undefined,
  );

  return (
    <form action={action} className="glass-soft mt-4 rounded-2xl px-6 py-5">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <Sparkles className="h-4 w-4 text-aqua-500" strokeWidth={1.6} />
        {t("plan.title")}
      </h2>
      <p className="mt-1.5 text-[15px] text-ink">{earlyAccess ? earlyLabel : standardLabel}</p>

      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="earlyAccess" value={earlyAccess ? "false" : "true"} />

      <FormAlert
        message={state?.message && !state.ok ? t(`errors.${state.message}`) : undefined}
      />

      <button type="submit" disabled={working} className="btn btn-ghost mt-4 w-full py-2.5 text-[15px]">
        {working ? t("decision.working") : earlyAccess ? t("plan.toStandard") : t("plan.toEarly")}
      </button>
      <p className="mt-2 text-center text-[13px] text-ink-faint">{t("plan.note")}</p>
    </form>
  );
}
