"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, RotateCcw } from "lucide-react";
import {
  reopenApplicationAction,
  resendApprovalEmailAction,
} from "@/app/actions/admin";
import type { FormState } from "@/lib/domain";
import { FormAlert, TextArea } from "@/components/form/Fields";

/**
 * Takes a decline back to pending. Asks for a reason because it lifts a
 * blocklist entry — the audit log should say why someone was let back in.
 */
export function ReopenPanel({ applicationId }: { applicationId: string }) {
  const t = useTranslations("admin");
  const [state, action, working] = useActionState<FormState, FormData>(
    reopenApplicationAction,
    undefined,
  );
  const [reason, setReason] = useState("");

  if (state?.ok) {
    return (
      <p className="glass-soft mt-4 rounded-2xl px-6 py-5 text-[15px] text-ink">
        {t("reopen.done")}
      </p>
    );
  }

  return (
    <form action={action} className="glass-soft mt-4 space-y-4 rounded-2xl px-6 py-5">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <RotateCcw className="h-4 w-4 text-aqua-500" strokeWidth={1.6} />
        {t("reopen.title")}
      </h2>
      <p className="text-[15px] leading-[1.6] text-ink-soft">{t("reopen.note")}</p>

      <input type="hidden" name="applicationId" value={applicationId} />
      <TextArea
        name="reason"
        label={t("reopen.reason")}
        rows={2}
        value={reason}
        onChange={setReason}
        error={
          state?.errors?.reason?.[0]
            ? t(`errors.${state.errors.reason[0]}`)
            : undefined
        }
      />

      <FormAlert
        message={state?.message && !state.ok ? t(`errors.${state.message}`) : undefined}
      />

      <button
        type="submit"
        disabled={working}
        className="btn btn-ghost w-full py-2.5 text-[15px]"
      >
        {working ? t("decision.working") : t("reopen.confirm")}
      </button>
    </form>
  );
}

/** Re-sends the approval email with a fresh activation link. */
export function ResendApprovalPanel({ applicationId }: { applicationId: string }) {
  const t = useTranslations("admin");
  const [state, action, working] = useActionState<FormState, FormData>(
    resendApprovalEmailAction,
    undefined,
  );

  return (
    <form action={action} className="glass-soft mt-4 rounded-2xl px-6 py-5">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <Mail className="h-4 w-4 text-aqua-500" strokeWidth={1.6} />
        {t("resend.title")}
      </h2>
      <p className="mt-1.5 text-[15px] leading-[1.6] text-ink-soft">
        {t("resend.note")}
      </p>

      <input type="hidden" name="applicationId" value={applicationId} />

      <FormAlert
        message={state?.message && !state.ok ? t(`errors.${state.message}`) : undefined}
      />

      {state?.ok ? (
        <p className="mt-4 text-[15px] text-aqua-700">{t("resend.done")}</p>
      ) : (
        <button
          type="submit"
          disabled={working}
          className="btn btn-ghost mt-4 w-full py-2.5 text-[15px]"
        >
          {working ? t("decision.working") : t("resend.confirm")}
        </button>
      )}
    </form>
  );
}
