"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { submitPartnerApplication } from "@/app/actions/application";
import {
  PARTNER_CATEGORIES,
  TEAM_SIZES,
  type FormState,
} from "@/lib/domain";
import {
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
  companyName: 1,
  brandName: 1,
  category: 1,
  teamSize: 1,
  street: 2,
  postalCode: 2,
  city: 2,
  country: 2,
  website: 2,
  ownerName: 3,
  contactPersonName: 3,
  email: 3,
  phone: 3,
  serviceDescription: 4,
  targetClientele: 4,
  expectations: 4,
  inviteCode: 4,
  consent: 4,
};

export function PartnerEnrollForm({ inviteCode }: { inviteCode?: string }) {
  const t = useTranslations("enroll");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    submitPartnerApplication,
    undefined,
  );

  const [companyName, setCompanyName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [category, setCategory] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [targetClientele, setTargetClientele] = useState("");
  const [expectations, setExpectations] = useState("");
  const [consent, setConsent] = useState(false);

  function validateStep(current: number): Errors {
    const errors: Errors = {};

    if (current === 1) {
      if (companyName.trim().length < 2) errors.companyName = "companyRequired";
      if (!category) errors.category = "categoryRequired";
      if (!teamSize) errors.teamSize = "teamSizeRequired";
    }

    if (current === 2) {
      if (street.trim().length < 2) errors.street = "streetRequired";
      if (postalCode.trim().length < 2) errors.postalCode = "postalRequired";
      if (city.trim().length < 2) errors.city = "cityRequired";
      if (country.trim().length < 2) errors.country = "countryRequired";
      if (website.trim() && !/^https?:\/\/\S+\.\S+/.test(website.trim()))
        errors.website = "websiteInvalid";
    }

    if (current === 3) {
      if (ownerName.trim().length < 2) errors.ownerName = "ownerRequired";
      if (contactPersonName.trim().length < 2)
        errors.contactPersonName = "contactRequired";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        errors.email = "emailInvalid";
      if (phone.replace(/\D/g, "").length < 6) errors.phone = "phoneInvalid";
    }

    if (current === 4) {
      if (serviceDescription.trim().length < 50)
        errors.serviceDescription = "descriptionShort";
      if (expectations.trim().length < 20)
        errors.expectations = "expectationsShort";
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
    { title: t("partner.step1Title"), desc: t("partner.step1Desc") },
    { title: t("partner.step2Title"), desc: t("partner.step2Desc") },
    { title: t("partner.step3Title"), desc: t("partner.step3Desc") },
    { title: t("partner.step4Title"), desc: t("partner.step4Desc") },
  ];

  return (
    <div className="glass edge-accent w-full rounded-[26px] px-6 py-8 sm:px-9 sm:py-10">
      <StepProgress total={TOTAL_STEPS} current={form.step} />

      <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-ink-faint">
        {t("nav.step", { current: form.step, total: TOTAL_STEPS })}
      </p>
      <h2 className="mt-2 font-display text-[26px] font-light text-ink sm:text-[30px]">
        {steps[form.step - 1].title}
      </h2>
      <p className="mt-1.5 text-[13.5px] text-ink-soft">
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

        <div className={form.step === 1 ? "space-y-6" : "hidden"}>
          <TextInput
            name="companyName"
            label={t("partner.companyName")}
            placeholder="Alpine Longevity Clinic AG"
            value={companyName}
            error={err("companyName")}
            onChange={(value) => {
              setCompanyName(value);
              form.clearError("companyName");
            }}
          />
          <TextInput
            name="brandName"
            label={t("partner.brandName")}
            hint={t("partner.brandNameHint")}
            value={brandName}
            error={err("brandName")}
            onChange={setBrandName}
          />
          <ChipRadio
            name="category"
            legend={t("partner.categoryQuestion")}
            options={PARTNER_CATEGORIES.map((value) => ({
              value,
              label: t(`options.category.${value}`),
            }))}
            selected={category}
            error={err("category")}
            onSelect={(value) => {
              setCategory(value);
              form.clearError("category");
            }}
          />
          <ChipRadio
            name="teamSize"
            legend={t("partner.teamSizeQuestion")}
            hint={t("partner.teamSizeHint")}
            options={TEAM_SIZES.map((value) => ({ value, label: value }))}
            selected={teamSize}
            error={err("teamSize")}
            onSelect={(value) => {
              setTeamSize(value);
              form.clearError("teamSize");
            }}
          />
        </div>

        <div className={form.step === 2 ? "space-y-5" : "hidden"}>
          <TextInput
            name="street"
            label={t("partner.street")}
            autoComplete="street-address"
            value={street}
            error={err("street")}
            onChange={(value) => {
              setStreet(value);
              form.clearError("street");
            }}
          />
          <div className="grid gap-5 sm:grid-cols-[1fr_2fr]">
            <TextInput
              name="postalCode"
              label={t("partner.postalCode")}
              autoComplete="postal-code"
              value={postalCode}
              error={err("postalCode")}
              onChange={(value) => {
                setPostalCode(value);
                form.clearError("postalCode");
              }}
            />
            <TextInput
              name="city"
              label={t("partner.city")}
              autoComplete="address-level2"
              value={city}
              error={err("city")}
              onChange={(value) => {
                setCity(value);
                form.clearError("city");
              }}
            />
          </div>
          <TextInput
            name="country"
            label={t("partner.country")}
            autoComplete="country-name"
            value={country}
            error={err("country")}
            onChange={(value) => {
              setCountry(value);
              form.clearError("country");
            }}
          />
          <TextInput
            name="website"
            type="url"
            label={t("partner.website")}
            placeholder="https://"
            value={website}
            error={err("website")}
            onChange={(value) => {
              setWebsite(value);
              form.clearError("website");
            }}
          />
        </div>

        <div className={form.step === 3 ? "space-y-5" : "hidden"}>
          <TextInput
            name="ownerName"
            label={t("partner.ownerName")}
            value={ownerName}
            error={err("ownerName")}
            onChange={(value) => {
              setOwnerName(value);
              form.clearError("ownerName");
            }}
          />
          <TextInput
            name="contactPersonName"
            label={t("partner.contactPersonName")}
            autoComplete="name"
            value={contactPersonName}
            error={err("contactPersonName")}
            onChange={(value) => {
              setContactPersonName(value);
              form.clearError("contactPersonName");
            }}
          />
          <TextInput
            name="email"
            type="email"
            label={t("partner.email")}
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
            label={t("partner.phone")}
            hint={t("member.phoneHint")}
            placeholder="+41 44 123 45 67"
            autoComplete="tel"
            value={phone}
            error={err("phone")}
            onChange={(value) => {
              setPhone(value);
              form.clearError("phone");
            }}
          />
        </div>

        <div className={form.step === 4 ? "space-y-6" : "hidden"}>
          <TextArea
            name="serviceDescription"
            label={t("partner.serviceDescription")}
            hint={t("partner.serviceDescriptionHint")}
            placeholder={t("partner.serviceDescriptionPlaceholder")}
            rows={5}
            value={serviceDescription}
            error={err("serviceDescription")}
            onChange={(value) => {
              setServiceDescription(value);
              form.clearError("serviceDescription");
            }}
          />
          <TextArea
            name="targetClientele"
            label={t("partner.targetClientele")}
            rows={3}
            value={targetClientele}
            error={err("targetClientele")}
            onChange={setTargetClientele}
          />
          <TextArea
            name="expectations"
            label={t("partner.expectations")}
            rows={3}
            value={expectations}
            error={err("expectations")}
            onChange={(value) => {
              setExpectations(value);
              form.clearError("expectations");
            }}
          />
          <ConsentCheckbox
            name="consent"
            label={t("nav.consentPartner")}
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
              className="btn btn-primary flex-1 py-2.5 text-[14.5px]"
            >
              {t("nav.continue")}
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary flex-1 py-2.5 text-[14.5px]"
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
