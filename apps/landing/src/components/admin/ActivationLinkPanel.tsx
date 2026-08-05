"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { KeyRound } from "lucide-react";
import { revealActivationLinkAction } from "@/app/actions/admin";
import type { FormState } from "@/lib/domain";
import { FormAlert } from "@/components/form/Fields";

/**
 * Reissues an approved applicant's activation link.
 *
 * Rendered only when no mail provider is configured — in that state the
 * approval email goes to a server log the reviewer cannot read, so without this
 * every approval is a dead end.
 */
export function ActivationLinkPanel({
  applicationId,
}: {
  applicationId: string;
}) {
  const t = useTranslations("admin");
  const [state, action, working] = useActionState<FormState, FormData>(
    revealActivationLinkAction,
    undefined,
  );

  return (
    <form action={action} className="glass-soft mt-4 rounded-2xl px-6 py-5">
      <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
        <KeyRound className="h-4 w-4 text-aqua-500" strokeWidth={1.6} />
        {t("detail.activationLinkTitle")}
      </h2>
      <p className="mt-1.5 text-[12.5px] leading-[1.6] text-ink-soft">
        {t("detail.activationLinkNote")}
      </p>

      <input type="hidden" name="applicationId" value={applicationId} />

      <FormAlert
        message={
          state?.message && !state.ok
            ? t(`errors.${state.message}`)
            : undefined
        }
      />

      {state?.activationUrl ? (
        <p className="mt-4 break-all rounded-xl border border-line bg-paper px-4 py-3 font-mono text-[11.5px] leading-[1.6] text-aqua-700">
          {state.activationUrl}
        </p>
      ) : (
        <button
          type="submit"
          disabled={working}
          className="btn btn-ghost mt-4 w-full py-2 text-[13px]"
        >
          {working
            ? t("detail.activationLinkWorking")
            : t("detail.activationLinkShow")}
        </button>
      )}
    </form>
  );
}
