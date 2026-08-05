"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Check, UserRound } from "lucide-react";
import { updateMemberProfileAction } from "@/app/actions/profile";
import { FOCUS_AREAS, GOALS, type FormState } from "@/lib/domain";
import {
  ChipCheckboxes,
  ChipRadio,
  FormAlert,
  TextArea,
  TextInput,
} from "@/components/form/Fields";

export type MemberProfileValues = {
  displayName: string;
  country: string;
  city: string;
  focusAreas: string[];
  goal: string;
  context: string;
};

export function MemberProfilePanel({
  initial,
}: {
  initial: MemberProfileValues;
}) {
  const t = useTranslations("account");
  const tEnroll = useTranslations("enroll");

  const [state, action, pending] = useActionState<FormState, FormData>(
    updateMemberProfileAction,
    undefined,
  );

  /* Controlled throughout: React discards uncontrolled input values when a form
     action re-renders, so a validation error would otherwise wipe everything
     the member had just typed. */
  const [values, setValues] = useState(initial);
  const set = <K extends keyof MemberProfileValues>(
    key: K,
    value: MemberProfileValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }));

  const fieldError = (name: string) => {
    const key = state?.errors?.[name]?.[0];
    return key ? t(`profile.errors.${key}`) : undefined;
  };

  return (
    <form action={action} className="glass-soft rounded-2xl px-6 py-5">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <UserRound className="h-4 w-4 text-aqua-500" strokeWidth={1.6} />
        {t("profile.title")}
      </h2>
      <p className="mt-1.5 text-[12.5px] leading-[1.6] text-ink-soft">
        {t("profile.subtitle")}
      </p>

      <div className="mt-5 space-y-4">
        <TextInput
          name="displayName"
          label={t("profile.displayName")}
          value={values.displayName}
          onChange={(value) => set("displayName", value)}
          error={fieldError("displayName")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            name="city"
            label={tEnroll("member.city")}
            value={values.city}
            onChange={(value) => set("city", value)}
            error={fieldError("city")}
          />
          <TextInput
            name="country"
            label={tEnroll("member.country")}
            value={values.country}
            onChange={(value) => set("country", value)}
            error={fieldError("country")}
          />
        </div>

        <ChipCheckboxes
          name="focusAreas"
          legend={tEnroll("member.focusQuestion")}
          options={FOCUS_AREAS.map((area) => ({
            value: area,
            label: tEnroll(`options.focus.${area}`),
          }))}
          selected={values.focusAreas}
          onToggle={(value, checked) =>
            set(
              "focusAreas",
              checked
                ? [...values.focusAreas, value]
                : values.focusAreas.filter((item) => item !== value),
            )
          }
          error={fieldError("focusAreas")}
        />

        <ChipRadio
          name="goal"
          legend={tEnroll("member.goalQuestion")}
          options={GOALS.map((goal) => ({
            value: goal,
            label: tEnroll(`options.goal.${goal}`),
          }))}
          selected={values.goal}
          onSelect={(value) => set("goal", value)}
          error={fieldError("goal")}
        />

        <TextArea
          name="context"
          label={t("profile.context")}
          hint={t("profile.contextHint")}
          value={values.context}
          onChange={(value) => set("context", value)}
          error={fieldError("context")}
          rows={4}
        />
      </div>

      <FormAlert
        message={
          state?.message && !state.ok
            ? t(`profile.errors.${state.message}`)
            : undefined
        }
      />

      {state?.ok && (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-aqua-700">
          <Check className="h-4 w-4" strokeWidth={2} />
          {t("profile.saved")}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary mt-6 w-full py-2.5 text-[14px]"
      >
        {pending ? t("profile.saving") : t("profile.save")}
      </button>
    </form>
  );
}
