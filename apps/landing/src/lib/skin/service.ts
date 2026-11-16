import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ObjectId } from "mongodb";
import type { PublicAccount } from "../auth/accounts";
import { accounts, partnerProfiles, skinScans, type SkinScanDoc } from "../db/collections";
import { getMemberProfile } from "../profile/service";

/**
 * TheONE skin analysis: one face photo in, a cosmetic reading out.
 *
 * Cosmetic only, by design. The model is told never to name a disease; when
 * something looks like it belongs with a doctor, it says so in general terms
 * and the member is pointed to a dermatologist among TheONE's partners.
 *
 * The photo is never stored. It is read once, here, and the request ends with
 * it; only the scores and the advice are kept, so a member's history shows how
 * their skin has changed without TheONE holding pictures of their face.
 */

/** Vision quality matters more here than in chat, so this has its own model. */
const SKIN_MODEL = process.env.SKIN_MODEL ?? "claude-opus-5-5";

/** Each scan is a paid model call; this is generous for a daily routine. */
const MAX_SCANS_PER_DAY = 10;
export const MAX_SKIN_IMAGE_BYTES = 4 * 1024 * 1024;

export const SKIN_KEYS = [
  "hydration",
  "lines",
  "pigmentation",
  "redness",
  "pores",
  "evenness",
  "radiance",
] as const;

let client: Anthropic | null | undefined;
function anthropic(): Anthropic | null {
  if (client !== undefined) return client;
  client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
  return client;
}

export function isSkinConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** JPEG, PNG or WebP, decided by the leading bytes rather than the client's word. */
function imageType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (starts(0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45) return "image/webp";
  return null;
}

/** A phone language tag ("fr-CH"), checked; kept here to avoid an import cycle with the assistant. */
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

/* ========================================================================== *
 * What the app receives
 * ========================================================================== */

export type SkinPartner = {
  id: string;
  name: string;
  category: string;
  city: string;
  reason: string;
};

export type SkinScan = {
  id: string;
  createdAt: string;
  overall: number;
  scores: { key: string; score: number; note: string }[];
  summary: string;
  focus: string[];
  morning: string[];
  evening: string[];
  partners: SkinPartner[];
  seeDoctor: boolean;
  doctorNote: string;
};

async function view(docs: SkinScanDoc[]): Promise<SkinScan[]> {
  const ids = [...new Set(docs.flatMap((d) => d.partners.map((p) => p.partnerProfileId.toHexString())))];
  const partners = ids.length
    ? await (await partnerProfiles())
        .find(
          { _id: { $in: ids.map((id) => new ObjectId(id)) }, published: true },
          { projection: { name: 1, category: 1, city: 1 } },
        )
        .toArray()
    : [];
  const byId = new Map(partners.map((p) => [p._id.toHexString(), p]));

  return docs.map((d) => ({
    id: d._id.toHexString(),
    createdAt: d.createdAt.toISOString(),
    overall: d.overall,
    scores: d.scores,
    summary: d.summary,
    focus: d.focus,
    morning: d.morning,
    evening: d.evening,
    partners: d.partners.flatMap((p) => {
      const partner = byId.get(p.partnerProfileId.toHexString());
      return partner
        ? [{
            id: partner._id.toHexString(),
            name: partner.name,
            category: partner.category,
            city: partner.city,
            reason: p.reason,
          }]
        : [];
    }),
    seeDoctor: d.seeDoctor,
    doctorNote: d.doctorNote,
  }));
}

export async function listSkinScans(accountId: string, limit = 30): Promise<SkinScan[]> {
  const docs = await (await skinScans())
    .find({ accountId: new ObjectId(accountId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return view(docs);
}

export async function deleteSkinScan(accountId: string, scanId: string): Promise<boolean> {
  if (!ObjectId.isValid(scanId)) return false;
  const result = await (await skinScans()).deleteOne({
    _id: new ObjectId(scanId),
    accountId: new ObjectId(accountId),
  });
  return result.deletedCount === 1;
}

/* ========================================================================== *
 * The analysis
 * ========================================================================== */

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "usable", "problem", "overall", "summary", "scores", "focus",
    "morning", "evening", "partners", "seeDoctor", "doctorNote",
  ],
  properties: {
    usable: { type: "boolean" },
    problem: { type: "string" },
    overall: { type: "integer" },
    summary: { type: "string" },
    scores: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "score", "note"],
        properties: {
          key: { type: "string", enum: [...SKIN_KEYS] },
          score: { type: "integer" },
          note: { type: "string" },
        },
      },
    },
    focus: { type: "array", items: { type: "string" } },
    morning: { type: "array", items: { type: "string" } },
    evening: { type: "array", items: { type: "string" } },
    partners: {
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

type ModelOutput = {
  usable: boolean;
  problem: string;
  overall: number;
  summary: string;
  scores: { key: string; score: number; note: string }[];
  focus: string[];
  morning: string[];
  evening: string[];
  partners: { id: string; reason: string }[];
  seeDoctor: boolean;
  doctorNote: string;
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
const noDashes = (s: string) => s.replace(/\s*[–—]\s*/g, ", ");

export type ScanOutcome =
  | { ok: true; scan: SkinScan }
  | { ok: false; reason: "not_configured" | "too_many" | "unsupported_type" | "too_large" | "unusable" | "error"; message?: string };

export async function analyseSkin(input: {
  account: PublicAccount;
  bytes: Uint8Array;
  language: unknown;
}): Promise<ScanOutcome> {
  const anthropicClient = anthropic();
  if (!anthropicClient) return { ok: false, reason: "not_configured" };

  if (input.bytes.byteLength === 0 || input.bytes.byteLength > MAX_SKIN_IMAGE_BYTES) {
    return { ok: false, reason: "too_large" };
  }
  const mediaType = imageType(input.bytes);
  if (!mediaType) return { ok: false, reason: "unsupported_type" };

  const accountId = new ObjectId(input.account.id);
  const scans = await skinScans();
  const today = await scans.countDocuments({
    accountId,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  if (today >= MAX_SCANS_PER_DAY) return { ok: false, reason: "too_many" };

  const tag = languageTag(input.language);
  const spoken = languageName(tag, input.account.locale);
  const informal =
    { German: ' informally as "du"', French: ' as "tu"', Italian: ' as "tu"', Spanish: ' as "tú"',
      Croatian: ' as "ti"', Russian: ' as "ты"', Turkish: ' as "sen"', Chinese: " as 你" }[spoken] ?? " warmly and directly";

  // The partners who can actually help with skin: brands, beauty and aesthetic
  // practices, clinics. Only these may be recommended, by id.
  // Seeded test partners are only ever offered to test accounts.
  const raw = (await (await accounts()).findOne(
    { _id: accountId },
    { projection: { isTestAccount: 1 } },
  )) as { isTestAccount?: boolean } | null;
  const candidates = await (await partnerProfiles())
    .find(
      {
        published: true,
        ...(raw?.isTestAccount ? {} : { isTestAccount: { $ne: true } }),
        $or: [
          { focusArea: { $in: ["beauty", "health", "wellness"] } },
          { category: { $in: ["beauty", "clinic", "practice", "wellness"] } },
        ],
      },
      { projection: { name: 1, category: 1, focusArea: 1, city: 1, country: 1, description: 1 } },
    )
    .limit(40)
    .toArray();
  // Products travel; a doctor does not. Doctors, practices and clinics are
  // only offered from the member's own city when TheONE knows it, so the two
  // or three suggested are ones they can actually visit.
  const city = (await getMemberProfile(input.account.id))?.city?.trim().toLowerCase() ?? "";
  const nearby = candidates.filter(
    (p) => p.category === "beauty" || !city || p.city.trim().toLowerCase() === city,
  );
  const directory = nearby.map((p) => ({
    id: p._id.toHexString(),
    name: p.name,
    category: p.category,
    focus: p.focusArea,
    city: `${p.city}, ${p.country}`,
    about: p.description.slice(0, 300),
  }));

  const system = `You are the skin concierge inside TheONE, a private membership app; you speak for its POWER AI. You look at one face photo and give a warm, precise cosmetic reading that helps the member look more radiant and youthful.

Rules:
- Cosmetic assessment only. Never diagnose, never name a disease or medical condition, never estimate age. If something looks like it belongs with a doctor (an unusual or changing spot or mole, a sore that does not look cosmetic, strong inflammation), set seeDoctor to true and in doctorNote gently suggest seeing a dermatologist, without naming any condition.
- If the photo does not show one face clearly enough (no face, several faces, very dark, blurred, heavy filter or make-up that hides the skin), set usable to false, explain in problem in one friendly sentence how to retake it, and leave the other fields empty or zero.
- Scores are 0 to 100 where higher is always better: hydration (looks well hydrated), lines (few fine lines and wrinkles), pigmentation (few dark spots), redness (calm, little redness), pores (refined pores), evenness (even tone and texture), radiance (glow). Give all seven, each with one short, kind, specific note. overall is your overall impression, 0 to 100.
- summary: two or three warm sentences addressed to the member${informal}. focus: the two most worthwhile things to work on. morning and evening: a short, realistic routine, three to five steps each, ingredient-led (e.g. vitamin C serum, SPF 50, retinol at night), no brand names in the routine.
- partners: up to three entries from the directory below, by exact id, whose products or treatments fit this skin: skincare brands for products, aesthetic doctors and practices for treatments, longevity clinics for the bigger picture. TheONE recommends only two or three hand-picked doctors or clinics per city, so name at most three in total and choose the very best fit. Each with a one-sentence reason. If none fits, return an empty list. Never invent a partner or an id.
- Be clear and decisive, like an expert who knows exactly what this skin needs. In the routine, name one specific thing per step and nothing vague: no "or", no "maybe", no lists of alternatives. Recommend only what truly fits these scores; every partner reason names the concrete product or treatment from that partner's description and which score it improves.
- Write every text in ${spoken}, addressing the member${informal}. Never use dashes; use a comma or a colon. Write TheONE, POWER AI and MATCH exactly like this. Never call TheONE "new".`;

  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await anthropicClient.beta.messages.create({
      model: SKIN_MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: OUTPUT_SCHEMA as unknown as Record<string, unknown> },
      },
      system,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: Buffer.from(input.bytes).toString("base64") },
            },
            {
              type: "text",
              text: `This is my face. Please read my skin.\n\nTheONE business partners you may recommend (JSON):\n${JSON.stringify(directory)}`,
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error("[skin] analysis failed:", error);
    return { ok: false, reason: "error" };
  }

  if (response.stop_reason === "refusal") {
    return { ok: false, reason: "unusable" };
  }

  const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text;
  let out: ModelOutput;
  try {
    out = JSON.parse(text ?? "") as ModelOutput;
  } catch {
    console.error("[skin] unparsable output");
    return { ok: false, reason: "error" };
  }

  if (!out.usable) {
    return { ok: false, reason: "unusable", message: noDashes(out.problem || "") };
  }

  const allowed = new Set(directory.map((d) => d.id));
  const byKey = new Map(out.scores.map((s) => [s.key, s]));
  const doc: SkinScanDoc = {
    _id: new ObjectId(),
    accountId,
    language: tag ?? input.account.locale,
    overall: clamp(out.overall),
    scores: SKIN_KEYS.filter((k) => byKey.has(k)).map((k) => ({
      key: k,
      score: clamp(byKey.get(k)!.score),
      note: noDashes(byKey.get(k)!.note),
    })),
    summary: noDashes(out.summary),
    focus: out.focus.slice(0, 3).map(noDashes),
    morning: out.morning.slice(0, 6).map(noDashes),
    evening: out.evening.slice(0, 6).map(noDashes),
    partners: out.partners
      .filter((p) => allowed.has(p.id))
      .slice(0, 3)
      .map((p) => ({ partnerProfileId: new ObjectId(p.id), reason: noDashes(p.reason) })),
    seeDoctor: Boolean(out.seeDoctor),
    doctorNote: noDashes(out.doctorNote || ""),
    createdAt: new Date(),
  };

  await scans.insertOne(doc);
  const [scan] = await view([doc]);
  return { ok: true, scan };
}
