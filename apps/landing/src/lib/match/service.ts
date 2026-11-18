import "server-only";
import * as z from "zod";
import { ObjectId } from "mongodb";
import {
  accounts,
  matchDecisions,
  matchProfiles,
  type MatchProfileDoc,
} from "../db/collections";
import { openConversation } from "../api/chat";
import { deleteImage } from "../storage/images";

/**
 * TheONE MATCH: members describe themselves and who they hope to meet, and are
 * suggested to each other when both sides fit.
 *
 * Nobody browses anybody. A profile is only ever shown to members whose wishes
 * it answers completely and whose own profile answers its wishes completely in
 * return (a 100 % fit), and contact opens only after both have said yes.
 */

/* ========================================================================== *
 * Vocabulary
 *
 * Stored as stable keys; the app turns them into German or English words.
 * ========================================================================== */

export const GENDERS = ["woman", "man"] as const;
export const HAIR_COLORS = ["blonde", "brown", "black", "red", "grey", "other"] as const;
export const EYE_COLORS = ["blue", "green", "brown", "grey", "hazel"] as const;
export const FIGURES = ["slim", "athletic", "average", "curvy", "strong"] as const;
export const INTENTIONS = ["relationship", "dating", "friendship"] as const;
export const HOBBIES = [
  "travel",
  "golf",
  "tennis",
  "sailing",
  "riding",
  "skiing",
  "fitness",
  "yoga",
  "wellness",
  "art",
  "music",
  "culture",
  "fashion",
  "cooking",
  "wine",
  "reading",
  "nature",
  "dancing",
] as const;

export const MAX_MATCH_PHOTOS = 4;

const thisYear = () => new Date().getUTCFullYear();

const WishesSchema = z
  .object({
    ageMin: z.number().int().min(18).max(99),
    ageMax: z.number().int().min(18).max(99),
    heightMin: z.number().int().min(140).max(220).nullable().default(null),
    heightMax: z.number().int().min(140).max(220).nullable().default(null),
    hairColors: z.array(z.enum(HAIR_COLORS)).max(HAIR_COLORS.length).default([]),
    eyeColors: z.array(z.enum(EYE_COLORS)).max(EYE_COLORS.length).default([]),
    figures: z.array(z.enum(FIGURES)).max(FIGURES.length).default([]),
  })
  .refine((w) => w.ageMin <= w.ageMax, { error: "ageRange", path: ["ageMax"] })
  .refine(
    (w) => w.heightMin === null || w.heightMax === null || w.heightMin <= w.heightMax,
    { error: "heightRange", path: ["heightMax"] },
  );

export const MatchProfileSchema = z.object({
  gender: z.enum(GENDERS),
  seeking: z.enum(GENDERS),
  // Adults only, and nobody is 120.
  birthYear: z
    .number()
    .int()
    .refine((y) => y <= thisYear() - 18 && y >= thisYear() - 99, { error: "birthYear" }),
  heightCm: z.number().int().min(140).max(220),
  hairColor: z.enum(HAIR_COLORS),
  eyeColor: z.enum(EYE_COLORS),
  figure: z.enum(FIGURES),
  profession: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(60),
  hobbies: z.array(z.enum(HOBBIES)).min(1).max(HOBBIES.length),
  intention: z.enum(INTENTIONS),
  about: z.string().trim().max(600).default(""),
  wishes: WishesSchema,
  visible: z.boolean().default(true),
});

export type MatchProfileInput = z.infer<typeof MatchProfileSchema>;

/* ========================================================================== *
 * What the app receives
 * ========================================================================== */

export type OwnMatchProfile = MatchProfileInput & { photos: string[] };

/** A suggested member, as the other side sees them. No surname, no contact. */
export type MatchCard = {
  id: string;
  firstName: string;
  age: number;
  city: string;
  profession: string;
  heightCm: number;
  hairColor: string;
  eyeColor: string;
  figure: string;
  hobbies: string[];
  intention: string;
  about: string;
  photos: string[];
  /** Always 100: only complete fits, both ways, are ever suggested. */
  score: number;
  sharedHobbies: string[];
  /** Which of the viewer's wishes this person answers: hair, eyes, figure, height. */
  fitsWishes: string[];
};

export type MatchSummary = {
  id: string;
  firstName: string;
  age: number;
  city: string;
  photo: string | null;
  conversationId: string | null;
  matchedAt: string;
};

function ownView(doc: MatchProfileDoc): OwnMatchProfile {
  return {
    gender: doc.gender,
    seeking: doc.seeking,
    birthYear: doc.birthYear,
    heightCm: doc.heightCm,
    hairColor: doc.hairColor as OwnMatchProfile["hairColor"],
    eyeColor: doc.eyeColor as OwnMatchProfile["eyeColor"],
    figure: doc.figure as OwnMatchProfile["figure"],
    profession: doc.profession,
    city: doc.city,
    hobbies: doc.hobbies as OwnMatchProfile["hobbies"],
    intention: doc.intention as OwnMatchProfile["intention"],
    about: doc.about,
    wishes: doc.wishes as OwnMatchProfile["wishes"],
    visible: doc.visible,
    photos: doc.photos,
  };
}

const ageOf = (doc: Pick<MatchProfileDoc, "birthYear">) => thisYear() - doc.birthYear;

/* ========================================================================== *
 * Fit
 * ========================================================================== */

type Fit = { score: number; fits: string[] };

/**
 * How well `other` answers `wisher`'s wishes, 0 to 1.
 *
 * Age is not scored here: it is a hard filter in the query, both ways. Every
 * wish left open counts as met, so a member with no preference about eye colour
 * is not punished for it.
 */
function wishFit(wisher: MatchProfileDoc, other: MatchProfileDoc): Fit {
  const w = wisher.wishes;
  const fits: string[] = [];
  let earned = 0;
  let possible = 0;

  const check = (key: string, weight: number, wanted: string[], value: string) => {
    possible += weight;
    if (wanted.length === 0) {
      earned += weight;
    } else if (wanted.includes(value)) {
      earned += weight;
      fits.push(key);
    }
  };

  check("hair", 1, w.hairColors, other.hairColor);
  check("eyes", 1, w.eyeColors, other.eyeColor);
  check("figure", 1.5, w.figures, other.figure);

  possible += 1;
  const tallEnough = w.heightMin === null || other.heightCm >= w.heightMin;
  const shortEnough = w.heightMax === null || other.heightCm <= w.heightMax;
  if (tallEnough && shortEnough) {
    earned += 1;
    if (w.heightMin !== null || w.heightMax !== null) fits.push("height");
  }

  return { score: earned / possible, fits };
}

/**
 * TheONE's promise: a suggestion fits completely. Every wish either side has
 * stated is met by the other, and both want the same kind of bond. Anyone who
 * misses a single point is never shown, so every suggestion is a 100 % fit.
 */
function isPerfectFit(me: MatchProfileDoc, other: MatchProfileDoc): boolean {
  return (
    me.intention === other.intention &&
    wishFit(me, other).score === 1 &&
    wishFit(other, me).score === 1
  );
}

function card(me: MatchProfileDoc, other: MatchProfileDoc): MatchCard {
  const sharedHobbies = me.hobbies.filter((h) => other.hobbies.includes(h));
  return {
    id: other.accountId.toHexString(),
    firstName: other.firstName,
    age: ageOf(other),
    city: other.city,
    profession: other.profession,
    heightCm: other.heightCm,
    hairColor: other.hairColor,
    eyeColor: other.eyeColor,
    figure: other.figure,
    hobbies: other.hobbies,
    intention: other.intention,
    about: other.about,
    photos: other.photos,
    score: 100,
    sharedHobbies,
    fitsWishes: wishFit(me, other).fits,
  };
}

/** Among perfect fits: most shared pastimes first, then the same city. */
function closeness(me: MatchProfileDoc, c: MatchCard): number {
  const sameCity = me.city.trim().toLowerCase() === c.city.trim().toLowerCase() ? 0.5 : 0;
  return c.sharedHobbies.length + sameCity;
}

/* ========================================================================== *
 * Own profile
 * ========================================================================== */

async function profileDoc(accountId: string): Promise<MatchProfileDoc | null> {
  return (await matchProfiles()).findOne({ accountId: new ObjectId(accountId) });
}

export async function getOwnMatchProfile(accountId: string): Promise<OwnMatchProfile | null> {
  const doc = await profileDoc(accountId);
  return doc ? ownView(doc) : null;
}

export async function saveMatchProfile(
  accountId: string,
  input: MatchProfileInput,
): Promise<OwnMatchProfile | null> {
  const id = new ObjectId(accountId);
  const account = await (await accounts()).findOne(
    { _id: id },
    { projection: { displayName: 1, isTestAccount: 1 } },
  );
  if (!account) return null;

  const raw = account as unknown as { displayName: string; isTestAccount?: boolean };
  const now = new Date();

  const doc = await (await matchProfiles()).findOneAndUpdate(
    { accountId: id },
    {
      $set: {
        ...input,
        firstName: raw.displayName.split(" ")[0] || raw.displayName,
        isTest: raw.isTestAccount === true,
        updatedAt: now,
      },
      $setOnInsert: { _id: new ObjectId(), accountId: id, photos: [], createdAt: now },
    },
    { upsert: true, returnDocument: "after" },
  );

  return doc ? ownView(doc) : null;
}

/** Leaves MATCH completely: profile, photos, and every yes and no either way. */
export async function deleteMatchProfile(accountId: string): Promise<void> {
  const id = new ObjectId(accountId);
  const doc = await (await matchProfiles()).findOneAndDelete({ accountId: id });
  await (await matchDecisions()).deleteMany({ $or: [{ fromId: id }, { toId: id }] });
  for (const url of doc?.photos ?? []) await deleteImage(url);
}

export async function setMatchPhotos(accountId: string, photos: string[]): Promise<void> {
  await (await matchProfiles()).updateOne(
    { accountId: new ObjectId(accountId) },
    { $set: { photos, updatedAt: new Date() } },
  );
}

export async function getMatchPhotos(accountId: string): Promise<string[] | null> {
  const doc = await profileDoc(accountId);
  return doc ? doc.photos : null;
}

/* ========================================================================== *
 * Suggestions and decisions
 * ========================================================================== */

/**
 * The filter for everyone who could be suggested to `me`, before scoring:
 * the right gender both ways, inside each other's age wishes, visible, and
 * from the same world (test accounts meet only test accounts).
 */
function compatibleWith(me: MatchProfileDoc) {
  const myAge = ageOf(me);
  return {
    accountId: { $ne: me.accountId },
    gender: me.seeking,
    seeking: me.gender,
    visible: true,
    isTest: me.isTest,
    birthYear: { $gte: thisYear() - me.wishes.ageMax, $lte: thisYear() - me.wishes.ageMin },
    "wishes.ageMin": { $lte: myAge },
    "wishes.ageMax": { $gte: myAge },
  };
}

/** Accounts that can still sign in; a suspended member is suggested to no one. */
async function activeAmong(ids: ObjectId[]): Promise<Set<string>> {
  const rows = await (await accounts())
    .find({ _id: { $in: ids }, status: "active" }, { projection: { _id: 1 } })
    .toArray();
  return new Set(rows.map((row) => row._id.toHexString()));
}

export async function suggestionsFor(
  accountId: string,
): Promise<{ ok: true; cards: MatchCard[] } | { ok: false; reason: "no_profile" }> {
  const me = await profileDoc(accountId);
  if (!me) return { ok: false, reason: "no_profile" };

  const decided = await (await matchDecisions())
    .find({ fromId: me.accountId }, { projection: { toId: 1 } })
    .toArray();

  const candidates = await (await matchProfiles())
    .find({
      ...compatibleWith(me),
      accountId: { $ne: me.accountId, $nin: decided.map((d) => d.toId) },
    })
    .limit(1000)
    .toArray();

  const perfect = candidates.filter((c) => isPerfectFit(me, c));
  const active = await activeAmong(perfect.map((c) => c.accountId));

  const cards = perfect
    .filter((c) => active.has(c.accountId.toHexString()))
    .map((c) => card(me, c))
    .sort((a, b) => closeness(me, b) - closeness(me, a))
    .slice(0, 20);

  return { ok: true, cards };
}

export type DecisionOutcome =
  | { ok: true; matched: false }
  | { ok: true; matched: true; match: MatchSummary }
  | { ok: false; reason: "no_profile" | "not_found" };

export async function decide(input: {
  accountId: string;
  targetId: string;
  decision: "like" | "pass";
}): Promise<DecisionOutcome> {
  const me = await profileDoc(input.accountId);
  if (!me) return { ok: false, reason: "no_profile" };
  if (!ObjectId.isValid(input.targetId)) return { ok: false, reason: "not_found" };

  // Only someone this member could actually have been shown: a yes is what
  // opens a chat, so it must not reach an arbitrary account by id.
  const target = await (await matchProfiles()).findOne({
    ...compatibleWith(me),
    accountId: new ObjectId(input.targetId),
  });
  if (!target || !isPerfectFit(me, target)) return { ok: false, reason: "not_found" };

  const decisions = await matchDecisions();
  await decisions.updateOne(
    { fromId: me.accountId, toId: target.accountId },
    {
      $set: { decision: input.decision },
      $setOnInsert: { _id: new ObjectId(), createdAt: new Date() },
    },
    { upsert: true },
  );

  if (input.decision === "pass") return { ok: true, matched: false };

  const theirs = await decisions.findOne({
    fromId: target.accountId,
    toId: me.accountId,
    decision: "like",
  });
  if (!theirs) return { ok: true, matched: false };

  const conversationId = await openConversation({
    accountId: me.accountId,
    counterpartId: target.accountId.toHexString(),
  });

  return {
    ok: true,
    matched: true,
    match: {
      id: target.accountId.toHexString(),
      firstName: target.firstName,
      age: ageOf(target),
      city: target.city,
      photo: target.photos[0] ?? null,
      conversationId,
      matchedAt: new Date().toISOString(),
    },
  };
}

/** Everyone this member and the other side have both said yes to. */
export async function matchesFor(accountId: string): Promise<MatchSummary[]> {
  const id = new ObjectId(accountId);
  const decisions = await matchDecisions();

  const mine = await decisions.find({ fromId: id, decision: "like" }).toArray();
  if (mine.length === 0) return [];

  const back = await decisions
    .find({ fromId: { $in: mine.map((d) => d.toId) }, toId: id, decision: "like" })
    .toArray();
  if (back.length === 0) return [];

  const profiles = await (await matchProfiles())
    .find({ accountId: { $in: back.map((d) => d.fromId) } })
    .toArray();
  const active = await activeAmong(profiles.map((p) => p.accountId));

  const when = new Map<string, Date>();
  for (const d of [...mine, ...back]) {
    const key = (d.fromId.equals(id) ? d.toId : d.fromId).toHexString();
    const previous = when.get(key);
    if (!previous || d.createdAt > previous) when.set(key, d.createdAt);
  }

  const summaries: MatchSummary[] = [];
  for (const p of profiles) {
    const key = p.accountId.toHexString();
    if (!active.has(key)) continue;
    summaries.push({
      id: key,
      firstName: p.firstName,
      age: ageOf(p),
      city: p.city,
      photo: p.photos[0] ?? null,
      conversationId: await openConversation({ accountId: id, counterpartId: key }),
      matchedAt: (when.get(key) ?? p.updatedAt).toISOString(),
    });
  }

  return summaries.sort((a, b) => b.matchedAt.localeCompare(a.matchedAt));
}
