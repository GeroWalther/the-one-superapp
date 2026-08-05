import * as z from "zod";

/* --- Enrollment vocabulary ---------------------------------------------- */
/* The `as const` tuples double as the option lists rendered in the enroll
   form and as the translation keys under `enroll.options.*`. */

export const ROLES = ["member", "partner"] as const;

/* Mirrors the seven verticals in `lib/services.ts` one-for-one, so every focus
   a member picks highlights exactly one card in the members grid. */
export const FOCUS_AREAS = [
  "health",
  "hotels",
  "property",
  "lifestyle",
  "beauty",
  "wellness",
  "insurance",
] as const;

export const GOALS = ["clarity", "access", "longevity", "network"] as const;

export const HORIZONS = ["now", "quarter", "year", "exploring"] as const;

export const REFERRALS = [
  "invitation",
  "member",
  "press",
  "search",
  "social",
  "other",
] as const;

export type Role = (typeof ROLES)[number];
export type FocusArea = (typeof FOCUS_AREAS)[number];
export type Goal = (typeof GOALS)[number];
export type Horizon = (typeof HORIZONS)[number];
export type Referral = (typeof REFERRALS)[number];

/* --- Schemas ------------------------------------------------------------- */

export const PasswordSchema = z
  .string()
  .min(8, { error: "passwordLength" })
  .regex(/[a-zA-Z]/, { error: "passwordLetter" })
  .regex(/[0-9]/, { error: "passwordNumber" });

export const EnrollSchema = z.object({
  fullName: z.string().trim().min(2, { error: "nameShort" }).max(80),
  email: z.email({ error: "emailInvalid" }).trim().toLowerCase(),
  password: PasswordSchema,
  role: z.enum(ROLES, { error: "roleRequired" }),
  country: z.string().trim().min(2, { error: "countryRequired" }).max(60),
  focus: z
    .array(z.enum(FOCUS_AREAS))
    .min(1, { error: "focusRequired" })
    .max(FOCUS_AREAS.length),
  goal: z.enum(GOALS, { error: "goalRequired" }),
  horizon: z.enum(HORIZONS, { error: "horizonRequired" }),
  referral: z.enum(REFERRALS, { error: "referralRequired" }),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  consent: z.literal("on", { error: "consentRequired" }),
});

export const LoginSchema = z.object({
  email: z.email({ error: "emailInvalid" }).trim().toLowerCase(),
  password: z.string().min(1, { error: "passwordRequired" }),
});

export type EnrollInput = z.infer<typeof EnrollSchema>;

/* Field-level errors are returned to the client as translation keys, so the
   messages stay localised in both `de` and `en`. */
export type FormState =
  | {
      errors?: Partial<Record<keyof EnrollInput | "email" | "password", string[]>>;
      /* A translation key under `enroll.errors` / `login.errors`. */
      message?: string;
    }
  | undefined;
