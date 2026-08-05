"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock } from "lucide-react";
import { enroll } from "@/app/actions/auth";
import {
  FOCUS_AREAS,
  GOALS,
  HORIZONS,
  REFERRALS,
  type FormState,
} from "@/lib/definitions";

const TOTAL_STEPS = 4;

/* Which step owns each field — used to bounce back to the right step when the
   server rejects something. */
const FIELD_STEP: Record<string, number> = {
  fullName: 1,
  email: 1,
  password: 1,
  role: 2,
  country: 2,
  focus: 3,
  goal: 3,
  horizon: 4,
  referral: 4,
  note: 4,
  consent: 4,
};

type Errors = Record<string, string>;

export function EnrollForm() {
  const t = useTranslations("enroll");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    enroll,
    undefined,
  );

  const [step, setStep] = useState(1);
  const [clientErrors, setClientErrors] = useState<Errors>({});
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("member");
  const [country, setCountry] = useState("");
  const [focus, setFocus] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [horizon, setHorizon] = useState("");
  const [referral, setReferral] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);

  /* Server-side errors, minus the fields the user has since edited. */
  const serverErrors = useMemo<Errors>(() => {
    const raw = state?.errors ?? {};
    const result: Errors = {};
    for (const [field, messages] of Object.entries(raw)) {
      if (dismissed.includes(field)) continue;
      const first = messages?.[0];
      if (first) result[field] = first;
    }
    return result;
  }, [state, dismissed]);

  /* When a new server response arrives carrying field errors, jump back to the
     step that owns the earliest one. Adjusting state during render (rather than
     in an effect) avoids rendering the wrong step for a frame. */
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    const fields = Object.keys(state?.errors ?? {});
    if (fields.length > 0) {
      // A fresh verdict supersedes anything the user dismissed by editing.
      setDismissed([]);
      setClientErrors({});
      setStep(
        Math.min(...fields.map((field) => FIELD_STEP[field] ?? TOTAL_STEPS)),
      );
    }
  }

  function errorFor(field: string): string | undefined {
    return clientErrors[field] ?? serverErrors[field];
  }

  function clearError(field: string) {
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setDismissed((prev) => (prev.includes(field) ? prev : [...prev, field]));
  }

  function validateStep(current: number): Errors {
    const errors: Errors = {};

    if (current === 1) {
      if (fullName.trim().length < 2) errors.fullName = "nameShort";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        errors.email = "emailInvalid";
      if (password.length < 8) errors.password = "passwordLength";
      else if (!/[a-zA-Z]/.test(password)) errors.password = "passwordLetter";
      else if (!/[0-9]/.test(password)) errors.password = "passwordNumber";
    }

    if (current === 2) {
      if (!role) errors.role = "roleRequired";
      if (country.trim().length < 2) errors.country = "countryRequired";
    }

    if (current === 3) {
      if (focus.length === 0) errors.focus = "focusRequired";
      if (!goal) errors.goal = "goalRequired";
    }

    if (current === 4) {
      if (!horizon) errors.horizon = "horizonRequired";
      if (!referral) errors.referral = "referralRequired";
      if (!consent) errors.consent = "consentRequired";
    }

    return errors;
  }

  function goNext() {
    const errors = validateStep(step);
    setClientErrors(errors);
    if (Object.keys(errors).length === 0) {
      setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  }

  function goBack() {
    setClientErrors({});
    setStep((prev) => Math.max(prev - 1, 1));
  }

  /* Last-chance guard: never post a form the client already knows is invalid. */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    for (let s = 1; s <= TOTAL_STEPS; s++) {
      const errors = validateStep(s);
      if (Object.keys(errors).length > 0) {
        event.preventDefault();
        setClientErrors(errors);
        setStep(s);
        return;
      }
    }
  }

  const stepTitles = [
    { title: t("step1Title"), desc: t("step1Desc") },
    { title: t("step2Title"), desc: t("step2Desc") },
    { title: t("step3Title"), desc: t("step3Desc") },
    { title: t("step4Title"), desc: t("step4Desc") },
  ];

  return (
    <div className="glass edge-gold w-full rounded-[26px] px-6 py-8 sm:px-9 sm:py-10">
      {/* Progress */}
      <div className="flex items-center gap-2" aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <span
            key={index}
            className={`h-[3px] flex-1 rounded-full transition-colors duration-500 ${
              index + 1 <= step
                ? "bg-gradient-to-r from-gold-400 to-gold-200"
                : "bg-white/10"
            }`}
          />
        ))}
      </div>

      <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-mist-faint">
        {t("stepLabel", { current: step, total: TOTAL_STEPS })}
      </p>
      <h2 className="mt-2 font-display text-[26px] font-light text-mist sm:text-[30px]">
        {stepTitles[step - 1].title}
      </h2>
      <p className="mt-1.5 text-[13.5px] text-mist-dim">
        {stepTitles[step - 1].desc}
      </p>

      <form
        action={formAction}
        onSubmit={handleSubmit}
        onKeyDown={(event) => {
          if (event.key === "Enter" && step < TOTAL_STEPS) {
            const target = event.target as HTMLElement;
            if (target.tagName !== "TEXTAREA") {
              event.preventDefault();
              goNext();
            }
          }
        }}
        className="mt-7"
      >
        <input type="hidden" name="locale" value={locale} />

        {/* --- Step 1: identity --- */}
        <div className={step === 1 ? "space-y-5" : "hidden"}>
          <Field label={t("fullName")} error={errorFor("fullName")} t={t}>
            <input
              type="text"
              name="fullName"
              autoComplete="name"
              placeholder={t("fullNamePlaceholder")}
              value={fullName}
              aria-invalid={Boolean(errorFor("fullName"))}
              onChange={(event) => {
                setFullName(event.target.value);
                clearError("fullName");
              }}
              className="field"
            />
          </Field>

          <Field label={t("email")} error={errorFor("email")} t={t}>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              aria-invalid={Boolean(errorFor("email"))}
              onChange={(event) => {
                setEmail(event.target.value);
                clearError("email");
              }}
              className="field"
            />
          </Field>

          <Field
            label={t("password")}
            error={errorFor("password")}
            hint={t("passwordHint")}
            t={t}
          >
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                placeholder={t("passwordPlaceholder")}
                value={password}
                aria-invalid={Boolean(errorFor("password"))}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearError("password");
                }}
                className="field pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((show) => !show)}
                aria-label={
                  showPassword ? t("hidePassword") : t("showPassword")
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-mist-faint transition-colors hover:text-mist"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.6} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.6} />
                )}
              </button>
            </div>
          </Field>
        </div>

        {/* --- Step 2: profile --- */}
        <div className={step === 2 ? "space-y-6" : "hidden"}>
          <fieldset>
            <legend className="mb-3 text-[13.5px] font-medium text-mist">
              {t("roleQuestion")}
            </legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {[
                {
                  value: "member",
                  title: t("roleMember"),
                  desc: t("roleMemberDesc"),
                },
                {
                  value: "partner",
                  title: t("rolePartner"),
                  desc: t("rolePartnerDesc"),
                },
              ].map((option) => (
                <label
                  key={option.value}
                  data-selected={role === option.value}
                  className="group relative cursor-pointer rounded-[18px] border border-white/12 bg-white/4 p-4 transition-all duration-300 hover:border-white/25 focus-within:ring-2 focus-within:ring-teal-400/40 data-[selected=true]:border-gold-300/60 data-[selected=true]:bg-gold-300/10"
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={role === option.value}
                    onChange={() => {
                      setRole(option.value);
                      clearError("role");
                    }}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-2">
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors ${
                        role === option.value
                          ? "border-gold-300 bg-gold-300"
                          : "border-white/30"
                      }`}
                    >
                      {role === option.value && (
                        <Check
                          className="h-2.5 w-2.5 text-ink-900"
                          strokeWidth={3}
                        />
                      )}
                    </span>
                    <span className="text-[14px] font-medium text-mist">
                      {option.title}
                    </span>
                  </span>
                  <span className="mt-1.5 block pl-6 text-[12.5px] leading-[1.6] text-mist-dim">
                    {option.desc}
                  </span>
                </label>
              ))}
            </div>
            <ErrorText error={errorFor("role")} t={t} />
          </fieldset>

          <Field label={t("country")} error={errorFor("country")} t={t}>
            <input
              type="text"
              name="country"
              autoComplete="country-name"
              placeholder={t("countryPlaceholder")}
              value={country}
              aria-invalid={Boolean(errorFor("country"))}
              onChange={(event) => {
                setCountry(event.target.value);
                clearError("country");
              }}
              className="field"
            />
          </Field>
        </div>

        {/* --- Step 3: focus --- */}
        <div className={step === 3 ? "space-y-7" : "hidden"}>
          <fieldset>
            <legend className="text-[13.5px] font-medium text-mist">
              {t("focusQuestion")}
            </legend>
            <p className="mt-1 text-[12px] text-mist-faint">{t("focusHint")}</p>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {FOCUS_AREAS.map((area) => {
                const selected = focus.includes(area);
                return (
                  <label
                    key={area}
                    data-selected={selected}
                    className="chip focus-within:ring-2 focus-within:ring-teal-400/40"
                  >
                    <input
                      type="checkbox"
                      name="focus"
                      value={area}
                      checked={selected}
                      onChange={(event) => {
                        setFocus((prev) =>
                          event.target.checked
                            ? [...prev, area]
                            : prev.filter((item) => item !== area),
                        );
                        clearError("focus");
                      }}
                      className="sr-only"
                    />
                    {selected && (
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    )}
                    {t(`options.focus.${area}`)}
                  </label>
                );
              })}
            </div>
            <ErrorText error={errorFor("focus")} t={t} />
          </fieldset>

          <RadioGroup
            name="goal"
            legend={t("goalQuestion")}
            options={GOALS.map((value) => ({
              value,
              label: t(`options.goal.${value}`),
            }))}
            selected={goal}
            onSelect={(value) => {
              setGoal(value);
              clearError("goal");
            }}
            error={errorFor("goal")}
            t={t}
          />
        </div>

        {/* --- Step 4: timing --- */}
        <div className={step === 4 ? "space-y-7" : "hidden"}>
          <RadioGroup
            name="horizon"
            legend={t("horizonQuestion")}
            options={HORIZONS.map((value) => ({
              value,
              label: t(`options.horizon.${value}`),
            }))}
            selected={horizon}
            onSelect={(value) => {
              setHorizon(value);
              clearError("horizon");
            }}
            error={errorFor("horizon")}
            t={t}
          />

          <RadioGroup
            name="referral"
            legend={t("referralQuestion")}
            options={REFERRALS.map((value) => ({
              value,
              label: t(`options.referral.${value}`),
            }))}
            selected={referral}
            onSelect={(value) => {
              setReferral(value);
              clearError("referral");
            }}
            error={errorFor("referral")}
            t={t}
          />

          <Field label={t("note")} error={errorFor("note")} t={t}>
            <textarea
              name="note"
              rows={3}
              placeholder={t("notePlaceholder")}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="field resize-none"
            />
          </Field>

          <div>
            <label className="flex cursor-pointer items-start gap-3 focus-within:outline-none">
              <input
                type="checkbox"
                name="consent"
                checked={consent}
                onChange={(event) => {
                  setConsent(event.target.checked);
                  clearError("consent");
                }}
                className="sr-only"
              />
              <span
                className={`mt-[2px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] border transition-colors ${
                  consent
                    ? "border-gold-300 bg-gold-300"
                    : "border-white/30 bg-white/5"
                }`}
              >
                {consent && (
                  <Check className="h-3 w-3 text-ink-900" strokeWidth={3} />
                )}
              </span>
              <span className="text-[12.5px] leading-[1.6] text-mist-dim">
                {t("consent")}
              </span>
            </label>
            <ErrorText error={errorFor("consent")} t={t} />
          </div>
        </div>

        {state?.message && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-[13px] text-destructive"
          >
            {t(`errors.${state.message}`)}
          </p>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              className="btn btn-ghost px-5 py-2.5 text-[14px]"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
              {t("back")}
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              className="btn btn-gold flex-1 py-2.5 text-[14.5px]"
            >
              {t("continue")}
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className="btn btn-gold flex-1 py-2.5 text-[14.5px]"
            >
              {pending ? (
                t("submitting")
              ) : (
                <>
                  <Lock className="h-4 w-4" strokeWidth={1.8} />
                  {t("submit")}
                </>
              )}
            </button>
          )}
        </div>
      </form>

      <p className="mt-6 text-center text-[12.5px] text-mist-faint">
        {t("haveAccount")}{" "}
        <Link
          href={`/${locale}/login`}
          className="text-gold-300 underline-offset-4 transition-colors hover:text-gold-200 hover:underline"
        >
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}

/* --- Small building blocks ------------------------------------------------ */

type Translate = (key: string) => string;

function Field({
  label,
  hint,
  error,
  children,
  t,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  t: Translate;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-medium text-mist">
        {label}
      </span>
      {children}
      {hint && !error && (
        <span className="mt-1.5 block text-[11.5px] text-mist-faint">
          {hint}
        </span>
      )}
      <ErrorText error={error} t={t} />
    </label>
  );
}

function ErrorText({ error, t }: { error?: string; t: Translate }) {
  if (!error) return null;
  return (
    <span className="mt-1.5 block text-[12px] text-destructive">
      {t(`errors.${error}`)}
    </span>
  );
}

function RadioGroup({
  name,
  legend,
  options,
  selected,
  onSelect,
  error,
  t,
}: {
  name: string;
  legend: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  error?: string;
  t: Translate;
}) {
  return (
    <fieldset>
      <legend className="mb-3.5 text-[13.5px] font-medium text-mist">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <label
              key={option.value}
              data-selected={isSelected}
              className="chip focus-within:ring-2 focus-within:ring-teal-400/40"
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => onSelect(option.value)}
                className="sr-only"
              />
              {isSelected && <Check className="h-3 w-3" strokeWidth={2.5} />}
              {option.label}
            </label>
          );
        })}
      </div>
      <ErrorText error={error} t={t} />
    </fieldset>
  );
}
