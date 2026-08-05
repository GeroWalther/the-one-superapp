"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import {
  MemberApplicationSchema,
  PartnerApplicationSchema,
  type FormState,
} from "@/lib/domain";
import { submitApplication } from "@/lib/applications/service";
import { RATE_LIMITS, checkRateLimit, clientKey } from "@/lib/rate-limit";
import type { Locale } from "@/lib/db/collections";

const SUPPORTED_LOCALES = ["de", "en"] as const;

function safeLocale(value: FormDataEntryValue | null): Locale {
  return SUPPORTED_LOCALES.includes(value as Locale) ? (value as Locale) : "de";
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Two limits, deliberately. The IP limit stops a single machine hammering the
 * form; the per-address limit stops a distributed attempt from burying one
 * person's inbox in confirmation mail.
 */
async function withinLimits(email: string): Promise<boolean> {
  const ip = await clientKey();
  const [byIp, byEmail] = await Promise.all([
    checkRateLimit(`application:ip:${ip}`, RATE_LIMITS.application),
    checkRateLimit(`application:email:${email}`, RATE_LIMITS.application),
  ]);
  return byIp.ok && byEmail.ok;
}

function failureState(reason: string): FormState {
  switch (reason) {
    case "blocked":
      // Deliberately identical to the duplicate message. Telling someone they
      // are blocklisted invites them to retry with a different identity.
      return { message: "alreadyOnRecord" };
    case "duplicate":
      return { message: "alreadyOnRecord" };
    case "invalid_invite":
      // Must be a form-level message, not a field error: the invite code lives
      // in a hidden input with nowhere to render one, so a field error would
      // make submit look like it silently did nothing.
      return { message: "inviteInvalid" };
    default:
      return { message: "serverError" };
  }
}

export async function submitMemberApplication(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = safeLocale(formData.get("locale"));

  const parsed = MemberApplicationSchema.safeParse({
    type: "member",
    fullName: text(formData, "fullName"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    dateOfBirth: text(formData, "dateOfBirth"),
    country: text(formData, "country"),
    city: text(formData, "city"),
    focusAreas: formData.getAll("focusAreas"),
    goal: formData.get("goal"),
    horizon: formData.get("horizon"),
    referralSource: formData.get("referralSource"),
    context: text(formData, "context"),
    inviteCode: text(formData, "inviteCode"),
    consent: formData.get("consent"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  if (!(await withinLimits(parsed.data.email))) {
    return { message: "rateLimited" };
  }

  const result = await submitApplication({
    application: parsed.data,
    locale,
  });

  if (!result.ok) return failureState(result.reason);

  redirect(
    `/${locale}/enroll/submitted?state=${result.autoApproved ? "approved" : "received"}`,
  );
}

export async function submitPartnerApplication(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = safeLocale(formData.get("locale"));

  const parsed = PartnerApplicationSchema.safeParse({
    type: "partner",
    companyName: text(formData, "companyName"),
    brandName: text(formData, "brandName"),
    category: formData.get("category"),
    teamSize: formData.get("teamSize"),
    street: text(formData, "street"),
    postalCode: text(formData, "postalCode"),
    city: text(formData, "city"),
    country: text(formData, "country"),
    website: text(formData, "website"),
    ownerName: text(formData, "ownerName"),
    contactPersonName: text(formData, "contactPersonName"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    serviceDescription: text(formData, "serviceDescription"),
    targetClientele: text(formData, "targetClientele"),
    expectations: text(formData, "expectations"),
    inviteCode: text(formData, "inviteCode"),
    consent: formData.get("consent"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  if (!(await withinLimits(parsed.data.email))) {
    return { message: "rateLimited" };
  }

  const result = await submitApplication({
    application: parsed.data,
    locale,
  });

  if (!result.ok) return failureState(result.reason);

  redirect(
    `/${locale}/enroll/submitted?state=${result.autoApproved ? "approved" : "received"}`,
  );
}
