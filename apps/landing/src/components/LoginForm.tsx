"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { login } from "@/app/actions/auth";
import type { FormState } from "@/lib/definitions";

export function LoginForm() {
  const t = useTranslations("login");
  const tEnroll = useTranslations("enroll");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    login,
    undefined,
  );
  const [showPassword, setShowPassword] = useState(false);

  /* Controlled on purpose: React resets uncontrolled fields once a form action
     settles, which would wipe the email on every failed attempt. */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const emailError = state?.errors?.email?.[0];
  const passwordError = state?.errors?.password?.[0];

  return (
    <div className="glass edge-gold w-full rounded-[26px] px-6 py-8 sm:px-9 sm:py-10">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="mt-3 font-display text-[30px] font-light text-mist sm:text-[34px]">
        {t("title")}
      </h1>
      <p className="mt-2 text-[13.5px] text-mist-dim">{t("subtitle")}</p>

      <form action={formAction} className="mt-8 space-y-5">
        <input type="hidden" name="locale" value={locale} />

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-mist">
            {t("email")}
          </span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(emailError)}
            className="field"
          />
          {emailError && (
            <span className="mt-1.5 block text-[12px] text-destructive">
              {t(`errors.${emailError}`)}
            </span>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-mist">
            {t("password")}
          </span>
          <span className="relative block">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(passwordError)}
              className="field pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((show) => !show)}
              aria-label={
                showPassword
                  ? tEnroll("hidePassword")
                  : tEnroll("showPassword")
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-mist-faint transition-colors hover:text-mist"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.6} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.6} />
              )}
            </button>
          </span>
          {passwordError && (
            <span className="mt-1.5 block text-[12px] text-destructive">
              {t(`errors.${passwordError}`)}
            </span>
          )}
        </label>

        {state?.message && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-[13px] text-destructive"
          >
            {t(`errors.${state.message}`)}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn btn-gold w-full py-3 text-[14.5px]"
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

      <p className="mt-6 text-center text-[12.5px] text-mist-faint">
        {t("noAccount")}{" "}
        <Link
          href={`/${locale}/enroll`}
          className="text-gold-300 underline-offset-4 transition-colors hover:text-gold-200 hover:underline"
        >
          {t("apply")}
        </Link>
      </p>
    </div>
  );
}
