"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MailCheck } from "lucide-react";
import {
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/app/actions/activation";
import type { FormState } from "@/lib/domain";
import { FormAlert, TextInput } from "@/components/form/Fields";
import { PasswordField } from "./PasswordField";

export function ForgotPasswordForm() {
  const t = useTranslations("forgotPassword");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    requestPasswordResetAction,
    undefined,
  );
  const [email, setEmail] = useState("");

  /* Success is reported for any syntactically valid address. Confirming which
     addresses exist would turn this form into a membership checker. */
  if (state?.ok) {
    return (
      <div className="glass edge-accent w-full rounded-[26px] px-7 py-9 text-center sm:px-9">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-aqua-500/30 bg-aqua-500/10">
          <MailCheck className="h-6 w-6 text-aqua-500" strokeWidth={1.5} />
        </span>
        <h2 className="mt-6 font-display text-[24px] font-light text-ink">
          {t("sentTitle")}
        </h2>
        <p className="mt-3 text-[13.5px] leading-[1.7] text-ink-soft">
          {t("sentBody")}
        </p>
        <Link
          href={`/${locale}/login`}
          className="btn btn-ghost mt-7 px-6 py-2.5 text-[14px]"
        >
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="glass edge-accent w-full rounded-[26px] px-6 py-8 sm:px-9 sm:py-10">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="mt-3 font-display text-[30px] font-light text-ink">
        {t("title")}
      </h1>
      <p className="mt-2 text-[13.5px] text-ink-soft">{t("subtitle")}</p>

      <form action={formAction} className="mt-8 space-y-5">
        <input type="hidden" name="locale" value={locale} />
        <TextInput
          name="email"
          type="email"
          label={t("email")}
          autoComplete="email"
          value={email}
          error={
            state?.errors?.email?.[0]
              ? t(`errors.${state.errors.email[0]}`)
              : undefined
          }
          onChange={setEmail}
        />
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary w-full py-3 text-[14.5px]"
        >
          {pending ? t("submitting") : t("submit")}
        </button>
      </form>

      <p className="mt-6 text-center text-[12.5px] text-ink-faint">
        <Link
          href={`/${locale}/login`}
          className="text-aqua-500 underline-offset-4 transition-colors hover:text-aqua-700 hover:underline"
        >
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("resetPassword");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    resetPasswordAction,
    undefined,
  );
  const [password, setPassword] = useState("");

  const rules = [
    { label: t("ruleLength"), met: password.length >= 10 },
    { label: t("ruleLower"), met: /[a-z]/.test(password) },
    { label: t("ruleUpper"), met: /[A-Z]/.test(password) },
    { label: t("ruleNumber"), met: /[0-9]/.test(password) },
  ];

  return (
    <div className="glass edge-accent w-full rounded-[26px] px-6 py-8 sm:px-9 sm:py-10">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="mt-3 font-display text-[30px] font-light text-ink">
        {t("title")}
      </h1>
      <p className="mt-2 text-[13.5px] text-ink-soft">{t("subtitle")}</p>

      <form action={formAction} className="mt-8 space-y-6">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="token" value={token} />

        <PasswordField
          label={t("password")}
          value={password}
          onChange={setPassword}
          rules={rules}
          error={
            state?.errors?.password?.[0]
              ? t(`errors.${state.errors.password[0]}`)
              : undefined
          }
        />

        <FormAlert
          message={state?.message ? t(`errors.${state.message}`) : undefined}
        />

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary w-full py-3 text-[14.5px]"
        >
          {pending ? t("submitting") : t("submit")}
        </button>
      </form>
    </div>
  );
}
