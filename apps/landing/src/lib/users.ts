import "server-only";
import { ObjectId, type Collection } from "mongodb";
import { hash, compare } from "bcryptjs";
import { getDb } from "./mongodb";
import type {
  EnrollInput,
  FocusArea,
  Goal,
  Horizon,
  Referral,
  Role,
} from "./definitions";

const BCRYPT_ROUNDS = 12;

export type MemberAnswers = {
  focus: FocusArea[];
  goal: Goal;
  horizon: Horizon;
  referral: Referral;
  note?: string;
};

type MemberDoc = {
  _id: ObjectId;
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
  country: string;
  answers: MemberAnswers;
  createdAt: Date;
};

/* What ever leaves this module — never the password hash. */
export type PublicMember = {
  id: string;
  fullName: string;
  firstName: string;
  email: string;
  role: Role;
  country: string;
  answers: MemberAnswers;
  createdAt: string;
};

let indexesReady: Promise<void> | undefined;

async function members(): Promise<Collection<MemberDoc>> {
  const db = await getDb();
  const collection = db.collection<MemberDoc>("members");

  // Ensure the unique email index once per process — this is what makes the
  // duplicate-signup check race-safe, not the findOne() in enroll().
  indexesReady ??= collection
    .createIndex({ email: 1 }, { unique: true })
    .then(() => undefined);
  await indexesReady;

  return collection;
}

function toPublicMember(doc: MemberDoc): PublicMember {
  return {
    id: doc._id.toHexString(),
    fullName: doc.fullName,
    firstName: doc.fullName.split(" ")[0] || doc.fullName,
    email: doc.email,
    role: doc.role,
    country: doc.country,
    answers: doc.answers,
    createdAt: doc.createdAt.toISOString(),
  };
}

export class DuplicateEmailError extends Error {}

export async function createMember(
  input: EnrollInput,
): Promise<PublicMember> {
  const collection = await members();
  const doc: MemberDoc = {
    _id: new ObjectId(),
    fullName: input.fullName,
    email: input.email,
    passwordHash: await hash(input.password, BCRYPT_ROUNDS),
    role: input.role,
    country: input.country,
    answers: {
      focus: input.focus,
      goal: input.goal,
      horizon: input.horizon,
      referral: input.referral,
      ...(input.note ? { note: input.note } : {}),
    },
    createdAt: new Date(),
  };

  try {
    await collection.insertOne(doc);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new DuplicateEmailError(input.email);
    }
    throw error;
  }

  return toPublicMember(doc);
}

export async function emailExists(email: string): Promise<boolean> {
  const collection = await members();
  const existing = await collection.findOne(
    { email },
    { projection: { _id: 1 } },
  );
  return existing !== null;
}

/** Returns the member only when the password matches. */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<PublicMember | null> {
  const collection = await members();
  const doc = await collection.findOne({ email });

  if (!doc) {
    // Spend comparable time on unknown emails so response timing does not
    // reveal which addresses are registered.
    await compare(password, "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    return null;
  }

  const ok = await compare(password, doc.passwordHash);
  return ok ? toPublicMember(doc) : null;
}

export async function findMemberById(
  id: string,
): Promise<PublicMember | null> {
  if (!ObjectId.isValid(id)) return null;

  const collection = await members();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  return doc ? toPublicMember(doc) : null;
}
