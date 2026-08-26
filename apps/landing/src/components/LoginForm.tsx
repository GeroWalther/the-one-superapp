"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { login } from "@/app/actions/auth";
import type { FormState } from "@/lib/domain";
import { ErrorText, FormAlert } from "@/components/form/Fields";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("login");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    login,
    undefined,
  );
  const [showPassword, setShowPassword] = useState(false);

  /* Controlled on purpose: React resets uncontrolled fields once a form action
     settles, which would wipe the identifier on every failed attempt. */
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const identifierError = state?.errors?.identifier?.[0];
  const passwordError = state?.errors?.password?.[0];

  return (
    <div className="glass edge-accent w-full rounded-[26px] px-6 py-8 sm:px-9 sm:py-10">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="mt-3 font-display text-[30px] font-light text-ink sm:text-[34px]">
        {t("title")}
      </h1>
      <p className="mt-2 text-[13.5px] text-ink-soft">{t("subtitle")}</p>

      <form action={formAction} className="mt-8 space-y-5">
        <input type="hidden" name="locale" value={locale} />
        {next && <input type="hidden" name="next" value={next} />}

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-ink">
            {t("identifier")}
          </span>
          <input
            type="text"
            name="identifier"
            autoComplete="username"
            autoCapitalize="none"
            placeholder={t("identifierPlaceholder")}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            aria-invalid={Boolean(identifierError)}
            className="field"
          />
          <ErrorText
            error={identifierError ? t(`errors.${identifierError}`) : undefined}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-ink">
            {t("password")}
          </span>
          <span className="relative block">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(passwordError)}
              className="field pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((show) => !show)}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-faint transition-colors hover:text-ink"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.6} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.6} />
              )}
            </button>
          </span>
          <ErrorText
            error={passwordError ? t(`errors.${passwordError}`) : undefined}
          />
        </label>

        <FormAlert
          message={state?.message ? t(`errors.${state.message}`) : undefined}
        />

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary w-full py-3 text-[14.5px]"
        >
          {pending ? (
            t("submitting")
          ) : (
            <>
              {t("submit")}
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 space-y-2 text-center text-[12.5px] text-ink-faint">
        <p>
          <Link
            href={`/${locale}/forgot-password`}
            className="text-aqua-500 underline-offset-4 transition-colors hover:text-aqua-700 hover:underline"
          >
            {t("forgot")}
          </Link>
        </p>
        <p>
          {t("noAccount")}{" "}
          <Link
            href={`/${locale}/enroll`}
            className="text-aqua-500 underline-offset-4 transition-colors hover:text-aqua-700 hover:underline"
          >
            {t("apply")}
          </Link>
        </p>
      </div>
    </div>
  );
}
