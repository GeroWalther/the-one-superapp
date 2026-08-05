"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import {
  EnrollSchema,
  LoginSchema,
  type FormState,
} from "@/lib/definitions";
import {
  DuplicateEmailError,
  createMember,
  verifyCredentials,
} from "@/lib/users";
import { createSession, deleteSession } from "@/lib/session-cookie";

const SUPPORTED_LOCALES = ["de", "en"] as const;

function safeLocale(value: FormDataEntryValue | null): string {
  return SUPPORTED_LOCALES.includes(value as (typeof SUPPORTED_LOCALES)[number])
    ? String(value)
    : "de";
}

export async function enroll(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = safeLocale(formData.get("locale"));

  const parsed = EnrollSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    country: formData.get("country"),
    focus: formData.getAll("focus"),
    goal: formData.get("goal"),
    horizon: formData.get("horizon"),
    referral: formData.get("referral"),
    note: formData.get("note") ?? "",
    consent: formData.get("consent"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    const member = await createMember(parsed.data);
    await createSession({ userId: member.id, role: member.role });
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return { errors: { email: ["emailTaken"] } };
    }
    console.error("[enroll] failed:", error);
    return { message: "serverError" };
  }

  // Outside the try/catch — redirect() signals by throwing.
  redirect(`/${locale}/members`);
}

export async function login(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = safeLocale(formData.get("locale"));

  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    const member = await verifyCredentials(
      parsed.data.email,
      parsed.data.password,
    );

    if (!member) {
      // Deliberately vague: do not reveal whether the email exists.
      return { message: "invalidCredentials" };
    }

    await createSession({ userId: member.id, role: member.role });
  } catch (error) {
    console.error("[login] failed:", error);
    return { message: "serverError" };
  }

  redirect(`/${locale}/members`);
}

export async function logout(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get("locale"));
  await deleteSession();
  redirect(`/${locale}`);
}
