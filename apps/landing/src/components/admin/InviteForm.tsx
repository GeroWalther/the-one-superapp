"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { createAdminInvitationAction } from "@/app/actions/admin";
import { ADMIN_INVITE_FREE_MONTHS, type FormState } from "@/lib/domain";
import {
  ChipRadio,
  FormAlert,
  TextArea,
  TextInput,
} from "@/components/form/Fields";

export function InviteForm() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createAdminInvitationAction,
    undefined,
  );

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [note, setNote] = useState("");

  return (
    <div className="glass-soft rounded-2xl p-6">
      <h2 className="text-[15px] font-semibold text-mist">
        {t("invitations.formTitle")}
      </h2>
      <p className="mt-1.5 text-[13px] leading-[1.6] text-mist-dim">
        {t("invitations.formNote", { months: ADMIN_INVITE_FREE_MONTHS })}
      </p>

      <form action={formAction} className="mt-6 space-y-5">
        <input type="hidden" name="locale" value={locale} />

        <TextInput
          name="email"
          type="email"
          label={t("invitations.email")}
          value={email}
          onChange={setEmail}
          error={
            state?.errors?.email?.[0]
              ? t(`errors.${state.errors.email[0]}`)
              : undefined
          }
        />

        <ChipRadio
          name="role"
          legend={t("invitations.roleQuestion")}
          options={[
            { value: "member", label: t("type.member") },
            { value: "partner", label: t("type.partner") },
          ]}
          selected={role}
          onSelect={setRole}
          error={
            state?.errors?.role?.[0]
              ? t(`errors.${state.errors.role[0]}`)
              : undefined
          }
        />

        <TextArea
          name="note"
          label={t("invitations.note")}
          hint={t("invitations.noteHint")}
          rows={2}
          value={note}
          onChange={setNote}
        />

        {state?.ok ? (
          <p className="rounded-xl border border-teal-400/35 bg-teal-400/10 px-4 py-3 text-[13px] text-teal-300">
            {t("invitations.sent")}
          </p>
        ) : (
          <FormAlert
            message={state?.message ? t(`errors.${state.message}`) : undefined}
          />
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn btn-gold w-full py-2.5 text-[14px]"
        >
          {pending ? (
            t("invitations.sending")
          ) : (
            <>
              <Send className="h-4 w-4" strokeWidth={1.8} />
              {t("invitations.send")}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
