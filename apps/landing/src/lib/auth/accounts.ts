import "server-only";
import { ObjectId } from "mongodb";
import { compare, hash } from "bcryptjs";
import {
  accounts,
  keyedHash,
  type AccountDoc,
  type Locale,
} from "../db/collections";
import { normaliseEmail, type AccountStatus, type PartnerTier, type Role } from "../domain";

const BCRYPT_ROUNDS = 12;

/**
 * A hash of a password that cannot exist — used to spend comparable time on
 * unknown identifiers so response timing does not reveal which usernames are
 * registered.
 */
const DUMMY_HASH =
  "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";

/** Everything that may leave this module. Never the password hash. */
export type PublicAccount = {
  id: string;
  role: Role;
  status: AccountStatus;
  username: string;
  email: string;
  displayName: string;
  firstName: string;
  locale: Locale;
  partnerTier: PartnerTier | null;
  freeMonthsGranted: number;
  freeUntil: string | null;
  successfulReferrals: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
};

export function toPublicAccount(doc: AccountDoc): PublicAccount {
  return {
    id: doc._id.toHexString(),
    role: doc.role,
    status: doc.status,
    username: doc.username,
    email: doc.email,
    displayName: doc.displayName,
    firstName: doc.displayName.split(" ")[0] || doc.displayName,
    locale: doc.locale,
    partnerTier: doc.partnerTier,
    freeMonthsGranted: doc.freeMonthsGranted,
    freeUntil: doc.freeUntil?.toISOString() ?? null,
    successfulReferrals: doc.successfulReferrals,
    stripeCustomerId: doc.stripeCustomerId,
    stripeSubscriptionId: doc.stripeSubscriptionId,
    currentPeriodEnd: doc.currentPeriodEnd?.toISOString() ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

export class UsernameTakenError extends Error {}
export class EmailTakenError extends Error {}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const collection = await accounts();
  const existing = await collection.findOne(
    { username: username.toLowerCase() },
    { projection: { _id: 1 } },
  );
  return existing === null;
}

export async function createAccount(input: {
  applicationId: ObjectId | null;
  role: Role;
  status: AccountStatus;
  username: string;
  email: string;
  password: string;
  displayName: string;
  locale: Locale;
  partnerTier?: PartnerTier | null;
  freeMonthsGranted?: number;
  invitedByAccountId?: ObjectId | null;
}): Promise<PublicAccount> {
  const collection = await accounts();
  const now = new Date();

  const doc: AccountDoc = {
    _id: new ObjectId(),
    applicationId: input.applicationId,
    role: input.role,
    status: input.status,
    username: input.username.toLowerCase(),
    email: normaliseEmail(input.email),
    emailHash: keyedHash(normaliseEmail(input.email)),
    phone: null,
    displayName: input.displayName,
    locale: input.locale,
    passwordHash: await hashPassword(input.password),
    partnerTier: input.partnerTier ?? null,

    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,

    freeMonthsGranted: input.freeMonthsGranted ?? 0,
    freeUntil: null,

    successfulReferrals: 0,
    referralFreeMonthsGranted: 0,
    invitedByAccountId: input.invitedByAccountId ?? null,

    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
  };

  try {
    await collection.insertOne(doc);
  } catch (error) {
    // The unique indexes are the real guard — a read-then-write check would
    // lose a race between two people claiming the same username.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      const message = String((error as { message?: string }).message ?? "");
      if (message.includes("username")) throw new UsernameTakenError();
      throw new EmailTakenError();
    }
    throw error;
  }

  return toPublicAccount(doc);
}

/** Login accepts either a username or an email address. */
export async function authenticate(
  identifier: string,
  password: string,
): Promise<PublicAccount | null> {
  const collection = await accounts();
  const value = identifier.trim().toLowerCase();

  const doc = await collection.findOne({
    $or: [{ username: value }, { email: value }],
  });

  if (!doc) {
    await compare(password, DUMMY_HASH);
    return null;
  }

  const ok = await compare(password, doc.passwordHash);
  if (!ok) return null;

  await collection.updateOne(
    { _id: doc._id },
    { $set: { lastLoginAt: new Date() } },
  );

  return toPublicAccount(doc);
}

export async function findAccountById(
  id: string,
): Promise<PublicAccount | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await accounts();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  return doc ? toPublicAccount(doc) : null;
}

export async function setPassword(
  accountId: ObjectId,
  password: string,
): Promise<void> {
  const collection = await accounts();
  await collection.updateOne(
    { _id: accountId },
    {
      $set: {
        passwordHash: await hashPassword(password),
        updatedAt: new Date(),
      },
    },
  );
}
