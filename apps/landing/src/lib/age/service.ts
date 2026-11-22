import "server-only";
import { ObjectId } from "mongodb";
import { longevityChecks, matchProfiles, skinScans, theoneAge } from "../db/collections";

/**
 * TheONE AGE: the member's biological age as one number.
 *
 * It is computed, never guessed: the calendar age, moved younger or older by
 * how they live (TheONE LONGEVITY CHECK score) and how their skin looks
 * (TheONE SKIN SCAN overall). The same answers always give the same number,
 * so a change in TheONE AGE always means a change in the member's life.
 *
 * Lifestyle orientation only, never a medical finding.
 */

/** A longevity score of 60 is neutral; every point away moves TheONE AGE by a quarter year. */
const LONGEVITY_NEUTRAL = 60;
const LONGEVITY_YEARS_PER_POINT = 0.25;
const LONGEVITY_MAX_YEARS = 10;

/** A skin overall of 70 is neutral; every point away moves TheONE AGE by 0.12 years. */
const SKIN_NEUTRAL = 70;
const SKIN_YEARS_PER_POINT = 0.12;
const SKIN_MAX_YEARS = 4;

/** What a pillar or the skin can reach with a good plan, used for the levers. */
const REACHABLE = 85;

const MIN_AGE = 16;
const PILLAR_KEYS = ["sleep", "stress", "movement", "nutrition", "connection", "prevention"] as const;

export type AgeLever = { key: (typeof PILLAR_KEYS)[number] | "skin"; years: number };

export type TheoneAge =
  | { status: "needsBirthYear" }
  | { status: "needsData"; birthYear: number; age: number }
  | {
      status: "ready";
      birthYear: number;
      /** Calendar age this year. */
      age: number;
      theoneAge: number;
      /** Calendar age minus TheONE AGE: positive means younger. */
      difference: number;
      longevity: { score: number; at: string } | null;
      skin: { overall: number; at: string } | null;
      /** Where the most years can be won back, biggest first. */
      levers: AgeLever[];
      /** TheONE AGE once the levers are pulled. */
      target: number;
      /** TheONE AGE over time, oldest first, one point per day with a check or scan. */
      history: { at: string; theoneAge: number }[];
    };

const thisYear = () => new Date().getUTCFullYear();
const clamp = (n: number, max: number) => Math.max(-max, Math.min(max, n));
const half = (n: number) => Math.round(n * 2) / 2;

function longevityYears(score: number): number {
  return clamp((LONGEVITY_NEUTRAL - score) * LONGEVITY_YEARS_PER_POINT, LONGEVITY_MAX_YEARS);
}

function skinYears(overall: number): number {
  return clamp((SKIN_NEUTRAL - overall) * SKIN_YEARS_PER_POINT, SKIN_MAX_YEARS);
}

/** The pure computation, exported for tests. */
export function computeAge(input: {
  age: number;
  longevityScore: number | null;
  skinOverall: number | null;
}): number {
  let years = input.age;
  if (input.longevityScore !== null) years += longevityYears(input.longevityScore);
  if (input.skinOverall !== null) years += skinYears(input.skinOverall);
  return Math.max(MIN_AGE, Math.round(years));
}

/** The levers: how many years each pillar, and the skin, could give back. */
export function computeLevers(input: {
  pillars: { key: string; score: number }[];
  skinOverall: number | null;
}): AgeLever[] {
  const levers: AgeLever[] = [];
  for (const pillar of input.pillars) {
    if (!(PILLAR_KEYS as readonly string[]).includes(pillar.key) || pillar.score >= REACHABLE) continue;
    // The longevity score follows the six pillars, so one pillar moves it by a sixth.
    const years = ((REACHABLE - pillar.score) / PILLAR_KEYS.length) * LONGEVITY_YEARS_PER_POINT;
    levers.push({ key: pillar.key as AgeLever["key"], years: half(years) });
  }
  if (input.skinOverall !== null && input.skinOverall < REACHABLE) {
    levers.push({ key: "skin", years: half(skinYears(input.skinOverall) - skinYears(REACHABLE)) });
  }
  return levers
    .filter((l) => l.years >= 0.5)
    .sort((a, b) => b.years - a.years)
    .slice(0, 3);
}

async function birthYearOf(accountId: ObjectId): Promise<number | null> {
  const own = await (await theoneAge()).findOne({ accountId });
  if (own) return own.birthYear;
  const match = await (await matchProfiles()).findOne({ accountId }, { projection: { birthYear: 1 } });
  return typeof match?.birthYear === "number" ? match.birthYear : null;
}

export function isValidBirthYear(year: unknown): year is number {
  return Number.isInteger(year) && (year as number) >= thisYear() - 110 && (year as number) <= thisYear() - MIN_AGE;
}

export async function setBirthYear(accountId: string, birthYear: number): Promise<void> {
  await (await theoneAge()).updateOne(
    { accountId: new ObjectId(accountId) },
    {
      $set: { birthYear, updatedAt: new Date() },
      $setOnInsert: { _id: new ObjectId(), accountId: new ObjectId(accountId) },
    },
    { upsert: true },
  );
}

export async function getTheoneAge(accountId: string): Promise<TheoneAge> {
  const id = new ObjectId(accountId);
  const birthYear = await birthYearOf(id);
  if (birthYear === null) return { status: "needsBirthYear" };
  const age = thisYear() - birthYear;

  const [checks, scans] = await Promise.all([
    (await longevityChecks())
      .find({ accountId: id }, { projection: { score: 1, pillars: 1, createdAt: 1 } })
      .sort({ createdAt: 1 })
      .limit(200)
      .toArray(),
    (await skinScans())
      .find({ accountId: id }, { projection: { overall: 1, createdAt: 1 } })
      .sort({ createdAt: 1 })
      .limit(200)
      .toArray(),
  ]);
  if (checks.length === 0 && scans.length === 0) return { status: "needsData", birthYear, age };

  // Walk through every check and scan in time order; each day keeps the
  // number it ended with, computed from the latest check and scan up to then.
  const events = [
    ...checks.map((c) => ({ at: c.createdAt, check: c.score as number | undefined, scan: undefined })),
    ...scans.map((s) => ({ at: s.createdAt, check: undefined, scan: s.overall as number | undefined })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());
  let score: number | null = null;
  let overall: number | null = null;
  const byDay = new Map<string, { at: string; theoneAge: number }>();
  for (const event of events) {
    if (event.check !== undefined) score = event.check;
    if (event.scan !== undefined) overall = event.scan;
    const day = event.at.toISOString().slice(0, 10);
    byDay.set(day, {
      at: event.at.toISOString(),
      theoneAge: computeAge({ age: event.at.getUTCFullYear() - birthYear, longevityScore: score, skinOverall: overall }),
    });
  }

  const lastCheck = checks.at(-1) ?? null;
  const lastScan = scans.at(-1) ?? null;
  const now = computeAge({
    age,
    longevityScore: lastCheck?.score ?? null,
    skinOverall: lastScan?.overall ?? null,
  });
  const levers = computeLevers({ pillars: lastCheck?.pillars ?? [], skinOverall: lastScan?.overall ?? null });
  const gain = levers.reduce((sum, l) => sum + l.years, 0);

  return {
    status: "ready",
    birthYear,
    age,
    theoneAge: now,
    difference: age - now,
    longevity: lastCheck ? { score: lastCheck.score, at: lastCheck.createdAt.toISOString() } : null,
    skin: lastScan ? { overall: lastScan.overall, at: lastScan.createdAt.toISOString() } : null,
    levers,
    target: Math.max(MIN_AGE, Math.round(now - gain)),
    history: [...byDay.values()].slice(-24),
  };
}
