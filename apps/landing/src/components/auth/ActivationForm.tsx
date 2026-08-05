"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { KeyRound } from "lucide-react";
import { activateAction } from "@/app/actions/activation";
import type { FormState } from "@/lib/domain";
import { FormAlert, TextInput } from "@/components/form/Fields";
import { PasswordField } from "./PasswordField";

export function ActivationForm({
  token,
  email,
  freeMonths,
}: {
  token: string;
  email: string;
  freeMonths: number;
}) {
  const t = useTranslations("activate");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    activateAction,
    undefined,
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const rules = [
    { label: t("ruleLength"), met: password.length >= 10 },
    { label: t("ruleLower"), met: /[a-z]/.test(password) },
    { label: t("ruleUpper"), met: /[A-Z]/.test(password) },
    { label: t("ruleNumber"), met: /[0-9]/.test(password) },
  ];

  const usernameError = state?.errors?.username?.[0];
  const passwordError = state?.errors?.password?.[0];

  return (
    <div className="glass edge-gold w-full rounded-[26px] px-6 py-8 sm:px-9 sm:py-10">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold-300/30 bg-gold-300/10">
          <KeyRound className="h-5 w-5 text-gold-300" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-[13px] text-mist-dim">{t("forEmail")}</p>
          <p className="text-[14.5px] font-medium text-mist">{email}</p>
        </div>
      </div>

      {freeMonths > 0 && (
        <p className="mt-5 rounded-xl border border-gold-300/30 bg-gold-300/10 px-4 py-3 text-[13px] text-gold-200">
          {t("freeMonths", { months: freeMonths })}
        </p>
      )}

      <form action={formAction} className="mt-7 space-y-6">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="token" value={token} />

        <TextInput
          name="username"
          label={t("username")}
          hint={t("usernameHint")}
          autoComplete="username"
          autoCapitalize="none"
          value={username}
          error={usernameError ? t(`errors.${usernameError}`) : undefined}
          onChange={(value) =>
            setUsername(value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))
          }
        />

        <PasswordField
          label={t("password")}
          value={password}
          onChange={setPassword}
          rules={rules}
          error={passwordError ? t(`errors.${passwordError}`) : undefined}
        />

        <FormAlert
          message={state?.message ? t(`errors.${state.message}`) : undefined}
        />

        <button
          type="submit"
          disabled={pending}
          className="btn btn-gold w-full py-3 text-[14.5px]"
        >
          {pending ? t("submitting") : t("submit")}
        </button>
      </form>
    </div>
  );
}
