import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ObjectId } from "mongodb";
import type { PublicAccount } from "../auth/accounts";
import { longevityChecks, longevityCourse, type LongevityCheckDoc } from "../db/collections";
import { getMemberProfile } from "../profile/service";
import { offeringsForAdvice, type OfferingView } from "../selection/service";

/**
 * TheONE LONGEVITY CHECK: thirteen short answers about how the member lives,
 * read by POWER AI into a longevity score, six pillars, a four week plan and
 * the exact clinic programmes and products that fit.
 *
 * Lifestyle and prevention only. It never diagnoses, and anything that sounds
 * like it belongs with a doctor is pointed there gently.
 */

const MODEL = process.env.LONGEVITY_MODEL ?? process.env.SKIN_MODEL ?? "claude-opus-5-5";
const MAX_CHECKS_PER_DAY = 5;

/** Every question and the answers it allows; anything else is rejected. */
export const QUESTIONS: Record<string, readonly string[]> = {
  age: ["under35", "35to44", "45to54", "55to64", "65plus"],
  sleepHours: ["under6", "6to7", "7to8", "over8"],
  rested: ["often", "sometimes", "rarely"],
  stress: ["low", "medium", "high", "veryHigh"],
  activeDays: ["0to1", "2to3", "4to5", "6to7"],
  strength: ["yes", "no"],
  food: ["wholeFoods", "mixed", "processed"],
  alcohol: ["none", "1to3", "4to7", "8plus"],
  smoking: ["never", "former", "current"],
  connection: ["strong", "some", "lonely"],
  checkup: ["withinYear", "1to3Years", "longer", "never"],
  energy: ["high", "moderate", "low"],
  goal: ["energy", "sleep", "weight", "mind", "younger", "healthspan"],
};

/**
 * TheONE LONGEVITY COURSE: eight lessons POWER AI teaches in conversation,
 * personal to the member's check, each ending with one task for the week.
 */
export const COURSE = [
  { key: "mindset", topic: "The longevity mindset: healthspan over lifespan, the few habits that matter most, and how small steps compound" },
  { key: "sleep", topic: "Deep sleep: rhythm, light, evening routine, bedroom, caffeine and alcohol timing" },
  { key: "nutrition", topic: "Eating for a long life: protein, plants and fibre, healthy fats, less sugar and ultra processed food, time restricted eating basics" },
  { key: "movement", topic: "Strength and movement: strength training, zone 2 endurance, daily steps, mobility" },
  { key: "stress", topic: "Calm and resilience: breathing, recovery, boundaries, nature, simple daily practices" },
  { key: "supplements", topic: "Supplements that matter: what has evidence (vitamin D, omega 3, magnesium, creatine, collagen and others), quality, and when to ask a doctor" },
  { key: "connection", topic: "Connection and purpose: relationships, community, meaning, and why they extend life" },
  { key: "prevention", topic: "Check-ups and prevention: which tests at which age, biomarkers worth knowing, and the yearly check-up" },
] as const;

export async function courseProgress(accountId: string): Promise<string[]> {
  const doc = await (await longevityCourse()).findOne({ accountId: new ObjectId(accountId) });
  return doc?.completed ?? [];
}

export async function completeLesson(accountId: string, lesson: string): Promise<string[] | null> {
  if (!COURSE.some((l) => l.key === lesson)) return null;
  const doc = await (await longevityCourse()).findOneAndUpdate(
    { accountId: new ObjectId(accountId) },
    {
      $addToSet: { completed: lesson },
      $set: { updatedAt: new Date() },
      $setOnInsert: { _id: new ObjectId(), accountId: new ObjectId(accountId) },
    },
    { upsert: true, returnDocument: "after" },
  );
  return doc?.completed ?? [lesson];
}

export const PILLARS = ["sleep", "stress", "movement", "nutrition", "connection", "prevention"] as const;

export type LongevityCheck = {
  id: string;
  createdAt: string;
  score: number;
  pillars: { key: string; score: number; note: string }[];
  summary: string;
  focus: string[];
  plan: { week: number; steps: string[] }[];
  picks: (OfferingView & { reason: string })[];
  seeDoctor: boolean;
  doctorNote: string;
};

let client: Anthropic | null | undefined;
function anthropic(): Anthropic | null {
  if (client !== undefined) return client;
  client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
  return client;
}

export function isLongevityConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function languageTag(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 35) return null;
  try {
    return Intl.getCanonicalLocales(raw.trim())[0] ?? null;
  } catch {
    return null;
  }
}

function languageName(tag: string | null, fallback: string): string {
  const base = (tag ?? fallback).split("-")[0];
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(base) ?? "English";
  } catch {
    return "English";
  }
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
const noDashes = (s: string) => s.replace(/\s*[–—]\s*/g, ", ");

async function view(docs: LongevityCheckDoc[], accountId: string): Promise<LongevityCheck[]> {
  const wanted = new Set(docs.flatMap((d) => d.offerings.map((o) => o.offeringId.toHexString())));
  const all = wanted.size ? await offeringsForAdvice({ accountId, limit: 500 }) : [];
  const byId = new Map(all.map((o) => [o.id, o]));
  return docs.map((d) => ({
    id: d._id.toHexString(),
    createdAt: d.createdAt.toISOString(),
    score: d.score,
    pillars: d.pillars,
    summary: d.summary,
    focus: d.focus,
    plan: d.plan,
    picks: d.offerings.flatMap((pick) => {
      const offering = byId.get(pick.offeringId.toHexString());
      return offering ? [{ ...offering, reason: pick.reason }] : [];
    }),
    seeDoctor: d.seeDoctor,
    doctorNote: d.doctorNote,
  }));
}

export async function listLongevityChecks(accountId: string, limit = 20): Promise<LongevityCheck[]> {
  const docs = await (await longevityChecks())
    .find({ accountId: new ObjectId(accountId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return view(docs, accountId);
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["score", "pillars", "summary", "focus", "plan", "picks", "seeDoctor", "doctorNote"],
  properties: {
    score: { type: "integer" },
    pillars: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "score", "note"],
        properties: {
          key: { type: "string", enum: [...PILLARS] },
          score: { type: "integer" },
          note: { type: "string" },
        },
      },
    },
    summary: { type: "string" },
    focus: { type: "array", items: { type: "string" } },
    plan: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["week", "steps"],
        properties: { week: { type: "integer" }, steps: { type: "array", items: { type: "string" } } },
      },
    },
    picks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "reason"],
        properties: { id: { type: "string" }, reason: { type: "string" } },
      },
    },
    seeDoctor: { type: "boolean" },
    doctorNote: { type: "string" },
  },
} as const;

type Output = {
  score: number;
  pillars: { key: string; score: number; note: string }[];
  summary: string;
  focus: string[];
  plan: { week: number; steps: string[] }[];
  picks: { id: string; reason: string }[];
  seeDoctor: boolean;
  doctorNote: string;
};

export type CheckOutcome =
  | { ok: true; check: LongevityCheck }
  | { ok: false; reason: "not_configured" | "invalid_answers" | "too_many" | "error" };

export async function runLongevityCheck(input: {
  account: PublicAccount;
  answers: unknown;
  note: unknown;
  language: unknown;
}): Promise<CheckOutcome> {
  const anthropicClient = anthropic();
  if (!anthropicClient) return { ok: false, reason: "not_configured" };

  // Only known questions with known answers: nothing free-form reaches the
  // prompt except the short note, which is length-capped.
  if (!input.answers || typeof input.answers !== "object") return { ok: false, reason: "invalid_answers" };
  const answers: Record<string, string> = {};
  for (const [question, options] of Object.entries(QUESTIONS)) {
    const value = (input.answers as Record<string, unknown>)[question];
    if (typeof value !== "string" || !options.includes(value)) return { ok: false, reason: "invalid_answers" };
    answers[question] = value;
  }
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 500) : "";

  const accountId = new ObjectId(input.account.id);
  const checks = await longevityChecks();
  const today = await checks.countDocuments({
    accountId,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  if (today >= MAX_CHECKS_PER_DAY) return { ok: false, reason: "too_many" };

  const tag = languageTag(input.language);
  const spoken = languageName(tag, input.account.locale);
  const informal =
    { German: ' informally as "du"', French: ' as "tu"', Italian: ' as "tu"', Spanish: ' as "tú"',
      Croatian: ' as "ti"', Russian: ' as "ты"', Turkish: ' as "sen"', Chinese: " as 你" }[spoken] ?? " warmly and directly";

  // What may be recommended: programmes and treatments from clinics in the
  // member's city (longevity, prevention, health and wellness), and products
  // from TheONE SELECTION, which travel.
  const city = (await getMemberProfile(input.account.id))?.city?.trim().toLowerCase() ?? "";
  const all = await offeringsForAdvice({
    accountId: input.account.id,
    kinds: ["program", "treatment", "product", "stay"],
    limit: 200,
  });
  const catalogue = all
    .filter((o) =>
      o.kind === "product"
        ? true
        : o.kind === "stay"
          // Wellness resorts travel: a recovery week is worth the journey.
          ? o.partner.category === "resort"
          : ["clinic", "wellness", "practice"].includes(o.partner.category) &&
            (!city || o.partner.city.trim().toLowerCase() === city),
    )
    .filter((o) => o.partner.category !== "beauty" || o.kind === "product")
    .map((o) => ({
      id: o.id,
      kind: o.kind,
      title: o.title,
      partner: `${o.partner.name}, ${o.partner.city}`,
      price: o.priceCents === null ? "on request" : `${o.priceNote === "from" ? "from " : ""}${(o.priceCents / 100).toFixed(0)} ${o.currency}`,
      about: o.description.slice(0, 200),
    }));

  const system = `You are the longevity concierge inside TheONE, a private membership app; you speak for its POWER AI. From a member's answers about how they live, you give a clear, warm, decisive reading of their longevity: how to stay young and healthy for longer.

Rules:
- Lifestyle and prevention only. Never diagnose, never name a disease, never give medication advice. If the answers suggest something that belongs with a doctor (for example years without a check-up together with low energy, or smoking), set seeDoctor to true and in doctorNote suggest a check-up gently, without naming any condition.
- score: the overall longevity score, 0 to 100, higher is better. pillars: all six (sleep, stress, movement, nutrition, connection, prevention), each 0 to 100 with one short, kind, specific note.
- summary: two or three warm sentences addressed to the member${informal}, naming their strengths first. focus: the two changes that will make the biggest difference for them, concretely.
- plan: four weeks, two or three specific steps each, building on each other, realistic for a busy life. Be clear and decisive: one specific thing per step, no "or", no "maybe".
- When a check-up is due (the last one more than a year ago, or never) and the catalogue has a clinic check-up, pick that check-up and name it in doctorNote as the way to get checked, rather than pointing elsewhere.
- picks: two or three exact items from the TheONE catalogue below, by exact id: at most one clinic programme, check-up or wellness resort stay and one or two products, each with one sentence on which pillar it serves and why it fits. Only what truly fits; never invent an id; empty if nothing fits.
- Write every text in ${spoken}, addressing the member${informal}. Never use dashes; use a comma or a colon. Write TheONE, POWER AI, TheONE LONGEVITY, TheONE SELECTION and TheONE MATCH exactly like this, always with TheONE in front. Never call TheONE "new".`;

  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await anthropicClient.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SCHEMA as unknown as Record<string, unknown> },
      },
      system,
      messages: [
        {
          role: "user",
          content: `My answers (JSON): ${JSON.stringify(answers)}${note ? `\nIn my own words: ${note}` : ""}\n\nTheONE catalogue you may pick from (JSON):\n${JSON.stringify(catalogue)}`,
        },
      ],
    });
  } catch (error) {
    console.error("[longevity] check failed:", error);
    return { ok: false, reason: "error" };
  }

  const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text;
  let out: Output;
  try {
    out = JSON.parse(text ?? "") as Output;
  } catch {
    return { ok: false, reason: "error" };
  }

  const allowed = new Set(catalogue.map((c) => c.id));
  const byKey = new Map(out.pillars.map((p) => [p.key, p]));
  const doc: LongevityCheckDoc = {
    _id: new ObjectId(),
    accountId,
    language: tag ?? input.account.locale,
    answers,
    note,
    score: clamp(out.score),
    pillars: PILLARS.filter((k) => byKey.has(k)).map((k) => ({
      key: k,
      score: clamp(byKey.get(k)!.score),
      note: noDashes(byKey.get(k)!.note),
    })),
    summary: noDashes(out.summary),
    focus: out.focus.slice(0, 3).map(noDashes),
    plan: out.plan.slice(0, 4).map((w, i) => ({ week: i + 1, steps: w.steps.slice(0, 4).map(noDashes) })),
    offerings: out.picks
      .filter((p) => allowed.has(p.id))
      .slice(0, 3)
      .map((p) => ({ offeringId: new ObjectId(p.id), reason: noDashes(p.reason) })),
    seeDoctor: Boolean(out.seeDoctor),
    doctorNote: noDashes(out.doctorNote || ""),
    createdAt: new Date(),
  };
  await checks.insertOne(doc);
  const [check] = await view([doc], input.account.id);
  return { ok: true, check };
}
