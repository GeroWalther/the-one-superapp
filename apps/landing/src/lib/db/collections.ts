import "server-only";
import { createHash } from "node:crypto";
import type { Collection, ObjectId } from "mongodb";
import { getDb } from "../mongodb";
import type {
  AccountStatus,
  ApplicantType,
  ApplicationStatus,
  InvitationKind,
  InvitationStatus,
  MemberApplicationInput,
  PartnerApplicationInput,
  PartnerTier,
  Role,
} from "../domain";

/**
 * Typed accessors for every collection, plus the index definitions.
 *
 * Indexes are created once per process behind a memoised promise. The unique
 * ones are load-bearing, not decoration: they are what actually makes duplicate
 * usernames and re-applications by declined people impossible under
 * concurrency, rather than the read-then-write checks in the callers.
 *
 * Collections for chat, partner profiles, and the assistant arrive with the
 * phases that use them — see docs/ARCHITECTURE.md.
 */

export type Locale = "de" | "en";

/* ========================================================================== *
 * Document shapes
 * ========================================================================== */

export type ApplicationDoc = {
  _id: ObjectId;
  type: ApplicantType;
  status: ApplicationStatus;
  /** Normalised, for lookup and display. */
  email: string;
  phone: string;
  /** Hashed copies, so a declined applicant can be blocked without retaining readable PII. */
  emailHash: string;
  phoneHash: string;
  /** Full name for members, company name for partners — what the admin list shows. */
  displayName: string;
  locale: Locale;
  /** The complete submitted payload, exactly as validated. */
  data: MemberApplicationInput | PartnerApplicationInput;
  invitationId: ObjectId | null;
  inviterAccountId: ObjectId | null;
  /** Assigned by an admin at approval time. Partners only. */
  partnerTier: PartnerTier | null;
  /** Free months this applicant will start with (12 for admin invitations). */
  grantedFreeMonths: number;
  reviewedAt: Date | null;
  reviewedByAccountId: ObjectId | null;
  internalReason: string | null;
  createdAt: Date;
};

export type AccountDoc = {
  _id: ObjectId;
  applicationId: ObjectId | null;
  role: Role;
  status: AccountStatus;
  username: string;
  email: string;
  emailHash: string;
  phone: string | null;
  displayName: string;
  locale: Locale;
  passwordHash: string;
  partnerTier: PartnerTier | null;

  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;

  /** Total free months ever granted, and the resulting paid-from date. */
  freeMonthsGranted: number;
  freeUntil: Date | null;

  /** Referrals that reached `active`, and the reward months already paid out for them. */
  successfulReferrals: number;
  referralFreeMonthsGranted: number;
  invitedByAccountId: ObjectId | null;
  /** Set once this account has earned its referrer a credit, so it counts once. */
  referralCreditedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
};

/** One document per blocked value, so an email and a phone never collide on one key. */
export type BlocklistDoc = {
  _id: ObjectId;
  kind: "email" | "phone";
  hash: string;
  applicationId: ObjectId;
  createdAt: Date;
};

export type InvitationDoc = {
  _id: ObjectId;
  code: string;
  kind: InvitationKind;
  role: "member" | "partner";
  /** Bound to one address: a leaked code cannot be redeemed by someone else. */
  invitedEmail: string;
  inviterAccountId: ObjectId | null;
  inviterName: string | null;
  grantsFreeMonths: number;
  status: InvitationStatus;
  note: string | null;
  applicationId: ObjectId | null;
  redeemedByAccountId: ObjectId | null;
  createdAt: Date;
  expiresAt: Date;
  redeemedAt: Date | null;
};

export type EntitlementGrantDoc = {
  _id: ObjectId;
  accountId: ObjectId;
  freeMonths: number;
  reason: "admin_invite" | "referral_tier" | "manual";
  detail: string | null;
  /** Referral count at the moment of the grant, for reason `referral_tier`. */
  referralCount: number | null;
  createdAt: Date;
};

export type AdminAuditDoc = {
  _id: ObjectId;
  actorAccountId: ObjectId | null;
  actorEmail: string;
  action:
    | "application.approved"
    | "application.declined"
    | "invitation.created"
    | "invitation.revoked"
    | "account.suspended"
    | "entitlement.granted";
  targetType: "application" | "account" | "invitation";
  targetId: ObjectId;
  detail: string | null;
  createdAt: Date;
};

/** Single-use, expiring tokens for activation and password reset. Hashed at rest. */
export type AuthTokenDoc = {
  _id: ObjectId;
  tokenHash: string;
  purpose: "activation" | "password_reset";
  applicationId: ObjectId | null;
  accountId: ObjectId | null;
  usedAt: Date | null;
  createdAt: Date;
  expiresAt: Date;
};

/* ========================================================================== *
 * Hashing
 * ========================================================================== */

/**
 * Blocklist and token hashing.
 *
 * Keyed rather than a bare SHA-256: an unsalted hash of an email address is
 * trivially reversible with a dictionary, which would turn the blocklist into a
 * readable list of everyone we rejected.
 *
 * ⚠ Rotating this secret silently invalidates the entire blocklist and every
 * outstanding activation/reset token — previously blocked addresses would hash
 * differently and could apply again. `HASH_SECRET` exists so it can be pinned
 * separately from `SESSION_SECRET`, which you may well want to rotate.
 */
export function keyedHash(value: string): string {
  const secret = process.env.HASH_SECRET ?? process.env.SESSION_SECRET ?? "";
  return createHash("sha256").update(`${secret}:${value}`).digest("hex");
}

/* ========================================================================== *
 * Accessors
 * ========================================================================== */

let indexesReady: Promise<void> | undefined;

async function ensureIndexes(): Promise<void> {
  const db = await getDb();

  await Promise.all([
    db.collection<ApplicationDoc>("applications").createIndexes([
      { key: { status: 1, createdAt: -1 } },
      { key: { email: 1 } },
      { key: { emailHash: 1 } },
      { key: { type: 1, status: 1 } },
    ]),

    db.collection<AccountDoc>("accounts").createIndexes([
      { key: { username: 1 }, unique: true },
      { key: { email: 1 }, unique: true },
      { key: { status: 1 } },
      { key: { invitedByAccountId: 1 } },
      { key: { stripeCustomerId: 1 }, sparse: true },
      { key: { stripeSubscriptionId: 1 }, sparse: true },
    ]),

    db
      .collection<BlocklistDoc>("blocklist")
      .createIndex({ kind: 1, hash: 1 }, { unique: true }),

    db.collection<InvitationDoc>("invitations").createIndexes([
      { key: { code: 1 }, unique: true },
      { key: { inviterAccountId: 1, createdAt: -1 } },
      { key: { invitedEmail: 1 } },
    ]),

    db
      .collection<EntitlementGrantDoc>("entitlementGrants")
      .createIndex({ accountId: 1, createdAt: -1 }),

    db
      .collection<AdminAuditDoc>("adminAuditLog")
      .createIndex({ createdAt: -1 }),

    db.collection<AuthTokenDoc>("authTokens").createIndexes([
      { key: { tokenHash: 1 }, unique: true },
      // Mongo reaps expired tokens on its own; no cleanup job to forget about.
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
    ]),
  ]);
}

async function collection<T extends { _id: ObjectId }>(
  name: string,
): Promise<Collection<T>> {
  const db = await getDb();
  indexesReady ??= ensureIndexes();
  await indexesReady;
  return db.collection<T>(name);
}

export const applications = () =>
  collection<ApplicationDoc>("applications");
export const accounts = () => collection<AccountDoc>("accounts");
export const blocklist = () => collection<BlocklistDoc>("blocklist");
export const invitations = () => collection<InvitationDoc>("invitations");
export const entitlementGrants = () =>
  collection<EntitlementGrantDoc>("entitlementGrants");
export const adminAuditLog = () => collection<AdminAuditDoc>("adminAuditLog");
export const authTokens = () => collection<AuthTokenDoc>("authTokens");
