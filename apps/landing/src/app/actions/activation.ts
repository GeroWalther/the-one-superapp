"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import {
  ActivationSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  type FormState,
} from "@/lib/domain";
import { activateAccount } from "@/lib/auth/activation";
import {
  completePasswordReset,
  requestPasswordReset,
} from "@/lib/auth/password-reset";
import { createSession } from "@/lib/auth/session-cookie";
import { RATE_LIMITS, checkRateLimit, clientKey } from "@/lib/rate-limit";
import type { Locale } from "@/lib/db/collections";

function safeLocale(value: FormDataEntryValue | null): Locale {
  return value === "en" ? "en" : "de";
}

export async function activateAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = safeLocale(formData.get("locale"));

  const parsed = ActivationSchema.safeParse({
    token: formData.get("token"),
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await activateAccount(parsed.data);

  if (!result.ok) {
    if (result.reason === "username_taken") {
      return { errors: { username: ["usernameTaken"] } };
    }
    return {
      message:
        result.reason === "invalid_token"
          ? "linkInvalid"
          : result.reason === "already_activated"
            ? "alreadyActivated"
            : "serverError",
    };
  }

  // Sign them straight in — they have just proven ownership of the inbox the
  // approval was sent to, and the next step is payment.
  await createSession({
    accountId: result.account.id,
    role: result.account.role,
  });

  redirect(`/${locale}/account`);
}

export async function requestPasswordResetAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = safeLocale(formData.get("locale"));

  const parsed = RequestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const ip = await clientKey();
  const limited = await checkRateLimit(
    `reset:ip:${ip}`,
    RATE_LIMITS.passwordReset,
  );
  // Reported as success even when limited, for the same reason the address is
  // never confirmed: the response must not vary with what the attacker tried.
  if (limited.ok) {
    await requestPasswordReset({ email: parsed.data.email, locale });
  }

  return { ok: true };
}

export async function resetPasswordAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = safeLocale(formData.get("locale"));

  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await completePasswordReset(parsed.data);

  if (!result.ok) {
    return {
      message: result.reason === "invalid_token" ? "linkInvalid" : "serverError",
    };
  }

  redirect(`/${locale}/login?reset=1`);
}
