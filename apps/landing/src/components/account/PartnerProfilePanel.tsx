"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Building2, Check, ImagePlus, Trash2 } from "lucide-react";
import {
  deletePartnerImageAction,
  updatePartnerProfileAction,
  uploadPartnerImageAction,
} from "@/app/actions/profile";
import { PARTNER_CATEGORIES, type FormState } from "@/lib/domain";
import {
  ChipRadio,
  FormAlert,
  TextArea,
  TextInput,
} from "@/components/form/Fields";

export type PartnerProfileValues = {
  name: string;
  category: string;
  description: string;
  targetClientele: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  published: boolean;
};

export function PartnerProfilePanel({
  initial,
  images,
  maxImages,
}: {
  initial: PartnerProfileValues;
  images: string[];
  maxImages: number;
}) {
  const t = useTranslations("account");
  const tEnroll = useTranslations("enroll");

  const [state, action, pending] = useActionState<FormState, FormData>(
    updatePartnerProfileAction,
    undefined,
  );
  const [uploadState, uploadAction, uploading] = useActionState<
    FormState,
    FormData
  >(uploadPartnerImageAction, undefined);

  const [values, setValues] = useState(initial);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadForm = useRef<HTMLFormElement>(null);

  const set = <K extends keyof PartnerProfileValues>(
    key: K,
    value: PartnerProfileValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }));

  const fieldError = (name: string) => {
    const key = state?.errors?.[name]?.[0];
    return key ? t(`profile.errors.${key}`) : undefined;
  };

  return (
    <div className="space-y-4 sm:col-span-2">
      {/* --- images ------------------------------------------------------- */}
      <section className="glass-soft rounded-2xl px-6 py-5">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <ImagePlus className="h-4 w-4 text-aqua-500" strokeWidth={1.6} />
          {t("profile.imagesTitle")}
        </h2>
        <p className="mt-1.5 text-[12.5px] leading-[1.6] text-ink-soft">
          {t("profile.imagesHint", { max: maxImages })}
        </p>

        {images.length > 0 && (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((url, index) => (
              <li key={url} className="group relative">
                <div className="relative aspect-4/3 overflow-hidden rounded-xl ring-1 ring-line">
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-paper/90 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-aqua-700 shadow-sm">
                    {t("profile.imageCover")}
                  </span>
                )}
                <form action={deletePartnerImageAction}>
                  <input type="hidden" name="url" value={url} />
                  <button
                    type="submit"
                    aria-label={t("profile.imageRemove")}
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-paper/90 text-ink-soft shadow-sm transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.7} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form ref={uploadForm} action={uploadAction} className="mt-4">
          <input
            ref={fileInput}
            type="file"
            name="image"
            accept="image/*"
            className="sr-only"
            /* Submitting on change keeps it to one visible step — a separate
               "upload" button after choosing a file is a step people forget. */
            onChange={() => uploadForm.current?.requestSubmit()}
          />
          <button
            type="button"
            disabled={uploading || images.length >= maxImages}
            onClick={() => fileInput.current?.click()}
            className="btn btn-ghost w-full py-2.5 text-[13.5px]"
          >
            <ImagePlus className="h-4 w-4" strokeWidth={1.6} />
            {uploading
              ? t("profile.uploading")
              : images.length >= maxImages
                ? t("profile.imagesFull")
                : t("profile.imageAdd")}
          </button>
        </form>

        <FormAlert
          message={
            uploadState?.message && !uploadState.ok
              ? t(`profile.errors.${uploadState.message}`)
              : undefined
          }
        />
      </section>

      {/* --- details ------------------------------------------------------ */}
      <form action={action} className="glass-soft rounded-2xl px-6 py-5">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <Building2 className="h-4 w-4 text-aqua-500" strokeWidth={1.6} />
          {t("profile.partnerTitle")}
        </h2>
        <p className="mt-1.5 text-[12.5px] leading-[1.6] text-ink-soft">
          {t("profile.partnerSubtitle")}
        </p>

        <div className="mt-5 space-y-4">
          <TextInput
            name="name"
            label={t("profile.partnerName")}
            value={values.name}
            onChange={(value) => set("name", value)}
            error={fieldError("name")}
          />

          <ChipRadio
            name="category"
            legend={tEnroll("partner.categoryQuestion")}
            options={PARTNER_CATEGORIES.map((category) => ({
              value: category,
              label: tEnroll(`options.category.${category}`),
            }))}
            selected={values.category}
            onSelect={(value) => set("category", value)}
            error={fieldError("category")}
          />

          <TextArea
            name="description"
            label={tEnroll("partner.serviceDescription")}
            value={values.description}
            onChange={(value) => set("description", value)}
            error={fieldError("description")}
            rows={5}
          />

          <TextArea
            name="targetClientele"
            label={tEnroll("partner.targetClientele")}
            value={values.targetClientele}
            onChange={(value) => set("targetClientele", value)}
            error={fieldError("targetClientele")}
            rows={3}
          />

          <TextInput
            name="street"
            label={tEnroll("partner.street")}
            value={values.street}
            onChange={(value) => set("street", value)}
            error={fieldError("street")}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <TextInput
              name="postalCode"
              label={tEnroll("partner.postalCode")}
              value={values.postalCode}
              onChange={(value) => set("postalCode", value)}
              error={fieldError("postalCode")}
            />
            <TextInput
              name="city"
              label={tEnroll("partner.city")}
              value={values.city}
              onChange={(value) => set("city", value)}
              error={fieldError("city")}
            />
            <TextInput
              name="country"
              label={tEnroll("partner.country")}
              value={values.country}
              onChange={(value) => set("country", value)}
              error={fieldError("country")}
            />
          </div>

          <TextInput
            name="website"
            label={tEnroll("partner.website")}
            value={values.website}
            onChange={(value) => set("website", value)}
            error={fieldError("website")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              name="contactEmail"
              label={t("profile.contactEmail")}
              type="email"
              value={values.contactEmail}
              onChange={(value) => set("contactEmail", value)}
              error={fieldError("contactEmail")}
            />
            <TextInput
              name="contactPhone"
              label={t("profile.contactPhone")}
              value={values.contactPhone}
              onChange={(value) => set("contactPhone", value)}
              error={fieldError("contactPhone")}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper-soft px-4 py-3">
            <input
              type="checkbox"
              name="published"
              checked={values.published}
              onChange={(event) => set("published", event.target.checked)}
              className="sr-only"
            />
            <span
              className={`mt-[2px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] border transition-colors ${
                values.published
                  ? "border-aqua-500 bg-aqua-500"
                  : "border-line bg-paper"
              }`}
            >
              {values.published && (
                <Check className="h-3 w-3 text-paper" strokeWidth={3} />
              )}
            </span>
            <span className="text-[12.5px] leading-[1.6] text-ink-soft">
              {t("profile.publishedLabel")}
            </span>
          </label>
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
    </div>
  );
}
