"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { LoginSchema, type FormState } from "@/lib/domain";
import { authenticate } from "@/lib/auth/accounts";
import { createSession, deleteSession } from "@/lib/auth/session-cookie";
import { RATE_LIMITS, checkRateLimit, clientKey } from "@/lib/rate-limit";
import type { Locale } from "@/lib/db/collections";

const SUPPORTED_LOCALES = ["de", "en"] as const;

function safeLocale(value: FormDataEntryValue | null): Locale {
  return SUPPORTED_LOCALES.includes(value as Locale) ? (value as Locale) : "de";
}

/**
 * Only same-origin absolute paths are honoured as a post-login destination.
 * Accepting arbitrary values would make this an open redirect — a phisher could
 * link to our own login page and bounce the victim to a lookalike afterwards.
 */
function safeNext(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function login(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = safeLocale(formData.get("locale"));
  const next = safeNext(formData.get("next"));

  const parsed = LoginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const ip = await clientKey();
  const [byIp, byIdentifier] = await Promise.all([
    checkRateLimit(`login:ip:${ip}`, RATE_LIMITS.login),
    checkRateLimit(
      `login:id:${parsed.data.identifier.toLowerCase()}`,
      RATE_LIMITS.login,
    ),
  ]);
  if (!byIp.ok || !byIdentifier.ok) return { message: "rateLimited" };

  let destination: string;

  try {
    const account = await authenticate(
      parsed.data.identifier,
      parsed.data.password,
    );

    // Deliberately identical for unknown identifier and wrong password —
    // distinguishing them turns the login form into a user-enumeration oracle.
    if (!account) return { message: "invalidCredentials" };

    if (account.status === "suspended") {
      return { message: "accountSuspended" };
    }

    await createSession({ accountId: account.id, role: account.role });

    destination =
      next ??
      (account.role === "admin"
        ? `/${locale}/admin`
        : `/${locale}/account`);
  } catch (error) {
    console.error("[login] failed:", error);
    return { message: "serverError" };
  }

  // Outside the try/catch — redirect() signals by throwing.
  redirect(destination);
}

export async function logout(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get("locale"));
  await deleteSession();
  redirect(`/${locale}`);
}
