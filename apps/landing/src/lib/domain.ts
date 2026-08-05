import * as z from "zod";

/**
 * The domain vocabulary for TheONE: every status, price, and validation rule
 * lives here so the forms, the admin dashboard, the billing code, and the
 * mobile API cannot drift apart.
 *
 * See docs/ARCHITECTURE.md for how these pieces fit together.
 */

/* ========================================================================== *
 * Vocabulary
 * ========================================================================== */

export const APPLICANT_TYPES = ["member", "partner"] as const;
export type ApplicantType = (typeof APPLICANT_TYPES)[number];

export const APPLICATION_STATUSES = ["pending", "approved", "declined"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** `active` is the only status permitted to sign into the iOS app. */
export const ACCOUNT_STATUSES = [
  "awaiting_payment",
  "active",
  "past_due",
  "canceled",
  "suspended",
] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const ROLES = ["member", "partner", "admin"] as const;
export type Role = (typeof ROLES)[number];

/** Assigned by an administrator at approval time — never self-reported. */
export const PARTNER_TIERS = ["large", "small"] as const;
export type PartnerTier = (typeof PARTNER_TIERS)[number];

export const INVITATION_KINDS = ["admin", "referral"] as const;
export type InvitationKind = (typeof INVITATION_KINDS)[number];

export const INVITATION_STATUSES = [
  "sent",
  "redeemed",
  "revoked",
  "expired",
] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

/* --- Member-facing option lists ------------------------------------------ */

/** Mirrors the seven verticals in `lib/services.ts` one-for-one. */
export const FOCUS_AREAS = [
  "health",
  "hotels",
  "property",
  "lifestyle",
  "beauty",
  "wellness",
  "insurance",
] as const;
export type FocusArea = (typeof FOCUS_AREAS)[number];

export const GOALS = ["clarity", "access", "longevity", "network"] as const;
export const HORIZONS = ["now", "quarter", "year", "exploring"] as const;
export const REFERRAL_SOURCES = [
  "invitation",
  "member",
  "press",
  "search",
  "social",
  "other",
] as const;

/* --- Partner-facing option lists ----------------------------------------- */

export const PARTNER_CATEGORIES = [
  "clinic",
  "hotel",
  "resort",
  "wellness",
  "beauty",
  "realEstate",
  "insurance",
  "practice",
  "other",
] as const;
export type PartnerCategory = (typeof PARTNER_CATEGORIES)[number];

/** Informational only — it helps the admin choose a tier, it does not set one. */
export const TEAM_SIZES = ["1-5", "6-20", "21-100", "100+"] as const;

/**
 * Maps a partner's own category onto the focus areas members pick during
 * enrolment, so "I care about health" surfaces clinics and practices without
 * either side having to know the other's vocabulary.
 */
export const CATEGORY_TO_FOCUS: Record<PartnerCategory, FocusArea> = {
  clinic: "health",
  practice: "health",
  hotel: "hotels",
  resort: "wellness",
  wellness: "wellness",
  beauty: "beauty",
  realEstate: "property",
  insurance: "insurance",
  other: "lifestyle",
};

/* ========================================================================== *
 * Pricing
 * ========================================================================== */

export type Plan = {
  key: string;
  amountCents: number;
  currency: "eur";
  interval: "month" | "year";
  label: string;
};

export const PLANS = {
  member: {
    key: "member",
    amountCents: 4_900,
    currency: "eur",
    interval: "month",
    label: "Member",
  },
  partnerLarge: {
    key: "partner_large",
    amountCents: 940_000,
    currency: "eur",
    interval: "year",
    label: "Partner — Large",
  },
  partnerSmall: {
    key: "partner_small",
    amountCents: 500_000,
    currency: "eur",
    interval: "year",
    label: "Partner — Small",
  },
} as const satisfies Record<string, Plan>;

export function planFor(role: Role, tier?: PartnerTier | null): Plan | null {
  if (role === "member") return PLANS.member;
  if (role === "partner") {
    return tier === "small" ? PLANS.partnerSmall : PLANS.partnerLarge;
  }
  return null; // admins are not billed
}

/* ========================================================================== *
 * Invitations and referral rewards
 * ========================================================================== */

/** Someone invited directly by an administrator gets a year on the house. */
export const ADMIN_INVITE_FREE_MONTHS = 12;

export const INVITATION_TTL_DAYS = 30;

/**
 * Thresholds, not increments: reaching 8 successful referrals means 6 free
 * months in total, not 3 + 6. Crossing a threshold grants the difference
 * between the new tier and whatever was already granted.
 *
 * Must stay sorted ascending by `referrals`.
 */
export const REFERRAL_TIERS = [
  { referrals: 5, freeMonths: 3 },
  { referrals: 8, freeMonths: 6 },
  { referrals: 12, freeMonths: 12 },
] as const;

/** Total free months earned at a given referral count (0 below the first tier). */
export function freeMonthsForReferrals(referrals: number): number {
  let earned = 0;
  for (const tier of REFERRAL_TIERS) {
    if (referrals >= tier.referrals) earned = tier.freeMonths;
  }
  return earned;
}

/** The next tier a referrer is working toward, for progress UI. */
export function nextReferralTier(
  referrals: number,
): (typeof REFERRAL_TIERS)[number] | null {
  return REFERRAL_TIERS.find((tier) => referrals < tier.referrals) ?? null;
}

/* ========================================================================== *
 * Normalisation
 * ========================================================================== */

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Reduces a phone number to `+` plus digits so the same line typed as
 * "+49 170 1234567", "0049-170-1234567", or "(0170) 123 45 67" hashes
 * identically in the blocklist.
 *
 * A leading `00` is the international prefix and becomes `+`. A leading single
 * `0` is a national trunk prefix that we cannot expand without knowing the
 * country, so it is left as-is — the blocklist is a best-effort barrier, not a
 * identity system.
 */
export function normalisePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return `+${digits.slice(1).replace(/\D/g, "")}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  return digits;
}

/* ========================================================================== *
 * Shared field schemas
 * ========================================================================== */

const emailField = z
  .email({ error: "emailInvalid" })
  .trim()
  .transform(normaliseEmail);

const phoneField = z
  .string()
  .trim()
  .min(6, { error: "phoneInvalid" })
  .max(32, { error: "phoneInvalid" })
  .refine((value) => normalisePhone(value).replace(/\D/g, "").length >= 6, {
    error: "phoneInvalid",
  })
  .transform(normalisePhone);

const consentField = z.literal("on", { error: "consentRequired" });

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const PasswordSchema = z
  .string()
  .min(10, { error: "passwordLength" })
  .max(128)
  .regex(/[a-z]/, { error: "passwordLower" })
  .regex(/[A-Z]/, { error: "passwordUpper" })
  .regex(/[0-9]/, { error: "passwordNumber" });

export const UsernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, { error: "usernameLength" })
  .max(24, { error: "usernameLength" })
  .regex(/^[a-z0-9_.]+$/, { error: "usernameChars" });

/** Applicants must be adults — this platform brokers medical and financial decisions. */
const dateOfBirthField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "dobInvalid" })
  .refine((value) => {
    const dob = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(dob.getTime())) return false;
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setUTCFullYear(eighteenYearsAgo.getUTCFullYear() - 18);
    return dob <= eighteenYearsAgo;
  }, { error: "dobUnderage" });

/* ========================================================================== *
 * Application schemas
 * ========================================================================== */

export const MemberApplicationSchema = z.object({
  type: z.literal("member"),
  fullName: z.string().trim().min(2, { error: "nameShort" }).max(80),
  email: emailField,
  phone: phoneField,
  dateOfBirth: dateOfBirthField,
  country: z.string().trim().min(2, { error: "countryRequired" }).max(60),
  city: z.string().trim().min(2, { error: "cityRequired" }).max(60),
  focusAreas: z
    .array(z.enum(FOCUS_AREAS))
    .min(1, { error: "focusRequired" })
    .max(FOCUS_AREAS.length),
  goal: z.enum(GOALS, { error: "goalRequired" }),
  horizon: z.enum(HORIZONS, { error: "horizonRequired" }),
  referralSource: z.enum(REFERRAL_SOURCES, { error: "referralRequired" }),
  context: optionalText(1000),
  inviteCode: optionalText(64),
  consent: consentField,
});

export const PartnerApplicationSchema = z.object({
  type: z.literal("partner"),
  companyName: z.string().trim().min(2, { error: "companyRequired" }).max(120),
  brandName: optionalText(120),
  category: z.enum(PARTNER_CATEGORIES, { error: "categoryRequired" }),
  teamSize: z.enum(TEAM_SIZES, { error: "teamSizeRequired" }),
  street: z.string().trim().min(2, { error: "streetRequired" }).max(120),
  postalCode: z.string().trim().min(2, { error: "postalRequired" }).max(16),
  city: z.string().trim().min(2, { error: "cityRequired" }).max(60),
  country: z.string().trim().min(2, { error: "countryRequired" }).max(60),
  website: z
    .union([z.url({ error: "websiteInvalid" }), z.literal("")])
    .optional(),
  ownerName: z.string().trim().min(2, { error: "ownerRequired" }).max(80),
  contactPersonName: z.string().trim().min(2, { error: "contactRequired" }).max(80),
  email: emailField,
  phone: phoneField,
  serviceDescription: z
    .string()
    .trim()
    .min(50, { error: "descriptionShort" })
    .max(2000),
  targetClientele: optionalText(600),
  expectations: z
    .string()
    .trim()
    .min(20, { error: "expectationsShort" })
    .max(1000),
  inviteCode: optionalText(64),
  consent: consentField,
});

export const ApplicationSchema = z.discriminatedUnion("type", [
  MemberApplicationSchema,
  PartnerApplicationSchema,
]);

export type MemberApplicationInput = z.infer<typeof MemberApplicationSchema>;
export type PartnerApplicationInput = z.infer<typeof PartnerApplicationSchema>;
export type ApplicationInput = z.infer<typeof ApplicationSchema>;

/* ========================================================================== *
 * Credential + auth schemas
 * ========================================================================== */

export const ActivationSchema = z.object({
  token: z.string().min(16),
  username: UsernameSchema,
  password: PasswordSchema,
});

export const LoginSchema = z.object({
  /** Username or email — resolved server-side. */
  identifier: z.string().trim().min(3, { error: "identifierRequired" }),
  password: z.string().min(1, { error: "passwordRequired" }),
});

export const RequestPasswordResetSchema = z.object({ email: emailField });

export const ResetPasswordSchema = z.object({
  token: z.string().min(16),
  password: PasswordSchema,
});

/* ========================================================================== *
 * Admin decision schemas
 * ========================================================================== */

export const ApproveSchema = z.object({
  applicationId: z.string().min(1),
  /** Required when approving a partner; ignored for members. */
  partnerTier: z.enum(PARTNER_TIERS).optional(),
  note: optionalText(1000),
});

export const DeclineSchema = z.object({
  applicationId: z.string().min(1),
  /** Internal — never sent to the applicant. */
  internalReason: z.string().trim().min(3, { error: "reasonRequired" }).max(1000),
  /** Optional, included in the decline email if present. */
  applicantMessage: optionalText(1000),
});

export const AdminInviteSchema = z.object({
  email: emailField,
  role: z.enum(["member", "partner"], { error: "roleRequired" }),
  note: optionalText(500),
});

export const ReferralInviteSchema = z.object({
  email: emailField,
  role: z.enum(["member", "partner"], { error: "roleRequired" }),
});

/* Field-level errors travel to the client as translation keys so messages stay
   localised in both `de` and `en`. */
export type FormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
      ok?: boolean;
    }
  | undefined;
