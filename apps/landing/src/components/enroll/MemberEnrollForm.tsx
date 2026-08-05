"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { submitMemberApplication } from "@/app/actions/application";
import {
  FOCUS_AREAS,
  GOALS,
  HORIZONS,
  REFERRAL_SOURCES,
  type FormState,
} from "@/lib/domain";
import {
  ChipCheckboxes,
  ChipRadio,
  ConsentCheckbox,
  FormAlert,
  StepProgress,
  TextArea,
  TextInput,
} from "@/components/form/Fields";
import { useSteppedForm, type Errors } from "@/components/form/useSteppedForm";

const TOTAL_STEPS = 4;

const FIELD_STEP: Record<string, number> = {
  fullName: 1,
  email: 1,
  phone: 1,
  dateOfBirth: 1,
  country: 2,
  city: 2,
  focusAreas: 3,
  goal: 3,
  horizon: 4,
  referralSource: 4,
  context: 4,
  inviteCode: 4,
  consent: 4,
};

export function MemberEnrollForm({ inviteCode }: { inviteCode?: string }) {
  const t = useTranslations("enroll");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    submitMemberApplication,
    undefined,
  );

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [horizon, setHorizon] = useState("");
  const [referralSource, setReferralSource] = useState(
    inviteCode ? "invitation" : "",
  );
  const [context, setContext] = useState("");
  const [consent, setConsent] = useState(false);

  function validateStep(current: number): Errors {
    const errors: Errors = {};

    if (current === 1) {
      if (fullName.trim().length < 2) errors.fullName = "nameShort";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        errors.email = "emailInvalid";
      if (phone.replace(/\D/g, "").length < 6) errors.phone = "phoneInvalid";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) errors.dateOfBirth = "dobInvalid";
      else {
        const dob = new Date(`${dateOfBirth}T00:00:00Z`);
        const cutoff = new Date();
        cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 18);
        if (Number.isNaN(dob.getTime())) errors.dateOfBirth = "dobInvalid";
        else if (dob > cutoff) errors.dateOfBirth = "dobUnderage";
      }
    }

    if (current === 2) {
      if (country.trim().length < 2) errors.country = "countryRequired";
      if (city.trim().length < 2) errors.city = "cityRequired";
    }

    if (current === 3) {
      if (focusAreas.length === 0) errors.focusAreas = "focusRequired";
      if (!goal) errors.goal = "goalRequired";
    }

    if (current === 4) {
      if (!horizon) errors.horizon = "horizonRequired";
      if (!referralSource) errors.referralSource = "referralRequired";
      if (!consent) errors.consent = "consentRequired";
    }

    return errors;
  }

  const form = useSteppedForm({
    state,
    totalSteps: TOTAL_STEPS,
    fieldStep: FIELD_STEP,
    validateStep,
  });

  const err = (field: string) => {
    const key = form.errorFor(field);
    return key ? t(`errors.${key}`) : undefined;
  };

  const steps = [
    { title: t("member.step1Title"), desc: t("member.step1Desc") },
    { title: t("member.step2Title"), desc: t("member.step2Desc") },
    { title: t("member.step3Title"), desc: t("member.step3Desc") },
    { title: t("member.step4Title"), desc: t("member.step4Desc") },
  ];

  return (
    <div className="glass edge-gold w-full rounded-[26px] px-6 py-8 sm:px-9 sm:py-10">
      <StepProgress total={TOTAL_STEPS} current={form.step} />

      <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-mist-faint">
        {t("nav.step", { current: form.step, total: TOTAL_STEPS })}
      </p>
      <h2 className="mt-2 font-display text-[26px] font-light text-mist sm:text-[30px]">
        {steps[form.step - 1].title}
      </h2>
      <p className="mt-1.5 text-[13.5px] text-mist-dim">
        {steps[form.step - 1].desc}
      </p>

      <form
        action={formAction}
        onSubmit={form.handleSubmit}
        onKeyDown={form.handleKeyDown}
        className="mt-7"
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="inviteCode" value={inviteCode ?? ""} />

        <div className={form.step === 1 ? "space-y-5" : "hidden"}>
          <TextInput
            name="fullName"
            label={t("member.fullName")}
            placeholder={t("member.fullNamePlaceholder")}
            autoComplete="name"
            value={fullName}
            error={err("fullName")}
            onChange={(value) => {
              setFullName(value);
              form.clearError("fullName");
            }}
          />
          <TextInput
            name="email"
            type="email"
            label={t("member.email")}
            placeholder={t("member.emailPlaceholder")}
            autoComplete="email"
            value={email}
            error={err("email")}
            onChange={(value) => {
              setEmail(value);
              form.clearError("email");
            }}
          />
          <TextInput
            name="phone"
            type="tel"
            label={t("member.phone")}
            hint={t("member.phoneHint")}
            placeholder="+41 79 123 45 67"
            autoComplete="tel"
            value={phone}
            error={err("phone")}
            onChange={(value) => {
              setPhone(value);
              form.clearError("phone");
            }}
          />
          <TextInput
            name="dateOfBirth"
            type="date"
            label={t("member.dateOfBirth")}
            hint={t("member.dateOfBirthHint")}
            autoComplete="bday"
            value={dateOfBirth}
            error={err("dateOfBirth")}
            onChange={(value) => {
              setDateOfBirth(value);
              form.clearError("dateOfBirth");
            }}
          />
        </div>

        <div className={form.step === 2 ? "space-y-5" : "hidden"}>
          <TextInput
            name="country"
            label={t("member.country")}
            placeholder="Schweiz"
            autoComplete="country-name"
            value={country}
            error={err("country")}
            onChange={(value) => {
              setCountry(value);
              form.clearError("country");
            }}
          />
          <TextInput
            name="city"
            label={t("member.city")}
            placeholder="Zürich"
            autoComplete="address-level2"
            value={city}
            error={err("city")}
            onChange={(value) => {
              setCity(value);
              form.clearError("city");
            }}
          />
        </div>

        <div className={form.step === 3 ? "space-y-7" : "hidden"}>
          <ChipCheckboxes
            name="focusAreas"
            legend={t("member.focusQuestion")}
            hint={t("member.focusHint")}
            options={FOCUS_AREAS.map((value) => ({
              value,
              label: t(`options.focus.${value}`),
            }))}
            selected={focusAreas}
            error={err("focusAreas")}
            onToggle={(value, checked) => {
              setFocusAreas((prev) =>
                checked ? [...prev, value] : prev.filter((item) => item !== value),
              );
              form.clearError("focusAreas");
            }}
          />
          <ChipRadio
            name="goal"
            legend={t("member.goalQuestion")}
            options={GOALS.map((value) => ({
              value,
              label: t(`options.goal.${value}`),
            }))}
            selected={goal}
            error={err("goal")}
            onSelect={(value) => {
              setGoal(value);
              form.clearError("goal");
            }}
          />
        </div>

        <div className={form.step === 4 ? "space-y-7" : "hidden"}>
          <ChipRadio
            name="horizon"
            legend={t("member.horizonQuestion")}
            options={HORIZONS.map((value) => ({
              value,
              label: t(`options.horizon.${value}`),
            }))}
            selected={horizon}
            error={err("horizon")}
            onSelect={(value) => {
              setHorizon(value);
              form.clearError("horizon");
            }}
          />
          <ChipRadio
            name="referralSource"
            legend={t("member.referralQuestion")}
            options={REFERRAL_SOURCES.map((value) => ({
              value,
              label: t(`options.referralSource.${value}`),
            }))}
            selected={referralSource}
            error={err("referralSource")}
            onSelect={(value) => {
              setReferralSource(value);
              form.clearError("referralSource");
            }}
          />
          <TextArea
            name="context"
            label={t("member.context")}
            placeholder={t("member.contextPlaceholder")}
            value={context}
            rows={3}
            error={err("context")}
            onChange={setContext}
          />
          <ConsentCheckbox
            name="consent"
            label={t("nav.consent")}
            checked={consent}
            error={err("consent")}
            onChange={(checked) => {
              setConsent(checked);
              form.clearError("consent");
            }}
          />
        </div>

        <FormAlert
          message={state?.message ? t(`errors.${state.message}`) : undefined}
        />

        <div className="mt-8 flex items-center gap-3">
          {form.step > 1 && (
            <button
              type="button"
              onClick={form.goBack}
              className="btn btn-ghost px-5 py-2.5 text-[14px]"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
              {t("nav.back")}
            </button>
          )}

          {form.step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={form.goNext}
              className="btn btn-gold flex-1 py-2.5 text-[14.5px]"
            >
              {t("nav.continue")}
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className="btn btn-gold flex-1 py-2.5 text-[14.5px]"
            >
              {pending ? (
                t("nav.submitting")
              ) : (
                <>
                  <Send className="h-4 w-4" strokeWidth={1.8} />
                  {t("nav.submit")}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
