import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ObjectId } from "mongodb";
import type { PublicAccount } from "../auth/accounts";
import { partnerProfiles, plans, type PlanDoc } from "../db/collections";
import { openConversation, sendMessage } from "../api/chat";
import { GERMAN_SPEAKING, offeringsForAdvice, type OfferingView } from "../selection/service";

/**
 * Ein Satz, alles erledigt: the member says one sentence ("a weekend to
 * recover in two weeks"), POWER AI puts the whole thing together from TheONE's
 * partners, flight, stay, treatment, products, and shows it as one plan.
 * Nothing is sent until the member says yes; then one tap reaches every
 * partner at once, each in their own conversation and their own language.
 *
 * Products are not requested: they are bought in the brand's own shop.
 */

const MAX_ITEMS = 6;
const LATIN_ONLY = /^[\p{Script=Latin}\p{N}\p{P}\p{S}\p{Z}\s]*$/u;
const noDashes = (s: string) => s.replace(/\s*[–—]\s*/g, ", ");
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export type PlanView = {
  id: string;
  title: string;
  when: string;
  status: PlanDoc["status"];
  items: (OfferingView & { note: string })[];
  /** What the priced items add up to, per currency. */
  totals: { currency: string; cents: number }[];
  /** Some items are priced on request, so the totals are not everything. */
  onRequest: boolean;
  conversations: { partnerName: string; conversationId: string }[];
};

async function view(doc: PlanDoc): Promise<PlanView> {
  const all = await offeringsForAdvice({ accountId: doc.accountId.toHexString(), limit: 500 });
  const byId = new Map(all.map((o) => [o.id, o]));
  const items = doc.items.flatMap((item) => {
    const offering = byId.get(item.offeringId.toHexString());
    return offering ? [{ ...offering, note: item.note }] : [];
  });
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.priceCents === null) continue;
    totals.set(item.currency, (totals.get(item.currency) ?? 0) + item.priceCents);
  }
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    when: doc.when,
    status: doc.status,
    items,
    totals: [...totals].map(([currency, cents]) => ({ currency, cents })),
    onRequest: items.some((i) => i.priceCents === null),
    conversations: doc.conversations,
  };
}

/**
 * When the wish takes place, read from the member's own words by a careful
 * model with today's calendar: "in two weeks, Friday to Sunday" has to land on
 * a Friday and a Sunday. Returns null when the words name no time, or when
 * the call fails, and the assistant's own reading stands.
 */
const DATE_MODEL = process.env.PLAN_DATE_MODEL ?? "claude-opus-5-5";
let dateClient: Anthropic | null | undefined;

async function resolveDates(wish: string, hint: { startDate: string | null; endDate: string | null }): Promise<{
  startDate: string | null;
  endDate: string | null;
  when: string;
} | null> {
  if (dateClient === undefined) dateClient = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
  if (!dateClient || !wish) return null;
  const today = new Date();
  const calendar = Array.from({ length: 70 }, (_, i) => {
    const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    return `${d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "Europe/Berlin" })} ${d.toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" })}`;
  }).join(", ");
  try {
    const response = await dateClient.messages.create({
      model: DATE_MODEL,
      max_tokens: 1000,
      output_config: {
        effort: "low",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["startDate", "endDate", "when"],
            properties: {
              startDate: { type: ["string", "null"], description: "YYYY-MM-DD or null" },
              endDate: { type: ["string", "null"], description: "YYYY-MM-DD or null" },
              when: { type: "string", description: "The dates for the member, in the language of the wish, with weekdays, e.g. \"Fr., 4. bis So., 6. Dezember\"; empty when no time is named." },
            },
          },
        },
      },
      system: `Today is ${today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" })}. The calendar from today: ${calendar}. Read when the member's wish takes place and give the first and last day. "In two weeks" means the week that starts on the Monday two weeks after this week's Monday; a weekend is Friday to Sunday unless they say otherwise; "next weekend" is the coming Friday to Sunday. Check every weekday against the calendar. If the wish names no time, return nulls and an empty when. Never use dashes.`,
      messages: [{ role: "user", content: `Wish: ${wish}\nThe assistant's own reading, which may be wrong: ${hint.startDate ?? "none"} to ${hint.endDate ?? "none"}` }],
    });
    const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? "";
    const out = JSON.parse(text) as { startDate: string | null; endDate: string | null; when: string };
    const ok = (d: string | null) => d === null || ISO_DAY.test(d);
    if (!ok(out.startDate) || !ok(out.endDate)) return null;
    return { startDate: out.startDate, endDate: out.endDate, when: noDashes(out.when.trim()) };
  } catch (error) {
    console.error("[plans] date reading failed:", error);
    return null;
  }
}

export type ProposeOutcome = { ok: true; plan: PlanView } | { ok: false; message: string };

export async function proposePlan(input: {
  account: PublicAccount;
  wish: unknown;
  title: unknown;
  when: unknown;
  startDate: unknown;
  endDate: unknown;
  guests: unknown;
  partnerNoteEn: unknown;
  partnerNoteDe: unknown;
  items: unknown;
}): Promise<ProposeOutcome> {
  const text = (v: unknown, max: number) => (typeof v === "string" ? noDashes(v.trim()).slice(0, max) : "");
  const title = text(input.title, 80);
  if (!title) return { ok: false, message: "A title is required." };
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, message: "A plan needs at least one item from search_selection." };
  }

  const allowed = new Map(
    (await offeringsForAdvice({ accountId: input.account.id, limit: 500 })).map((o) => [o.id, o]),
  );
  const items: PlanDoc["items"] = [];
  const unknown: string[] = [];
  for (const raw of input.items.slice(0, MAX_ITEMS)) {
    const id = typeof raw?.offeringId === "string" ? raw.offeringId : "";
    if (!allowed.has(id)) {
      unknown.push(id || "(missing)");
      continue;
    }
    if (items.some((i) => i.offeringId.toHexString() === id)) continue;
    items.push({ offeringId: new ObjectId(id), note: text(raw?.note, 200) });
  }
  if (unknown.length) {
    return {
      ok: false,
      message: `Unknown offering ids: ${unknown.join(", ")}. Call search_selection now and use the exact ids it returns.`,
    };
  }

  const partnerNoteEn = text(input.partnerNoteEn, 400);
  const partnerNoteDe = text(input.partnerNoteDe, 400);
  if (!LATIN_ONLY.test(partnerNoteEn) || !LATIN_ONLY.test(partnerNoteDe)) {
    return { ok: false, message: "partnerNoteEn must be English and partnerNoteDe German." };
  }
  const day = (v: unknown) => (typeof v === "string" && ISO_DAY.test(v) ? v : null);
  const guests = Number.isInteger(input.guests) && (input.guests as number) > 0 && (input.guests as number) < 30
    ? (input.guests as number)
    : null;

  const wish = text(input.wish, 500);
  let startDate = day(input.startDate);
  let endDate = day(input.endDate);
  let when = text(input.when, 80);
  const dates = await resolveDates(wish, { startDate, endDate });
  if (dates && dates.startDate) {
    startDate = dates.startDate;
    endDate = dates.endDate;
    if (dates.when) when = dates.when.slice(0, 80);
  }

  const doc: PlanDoc = {
    _id: new ObjectId(),
    accountId: new ObjectId(input.account.id),
    wish,
    title,
    when,
    startDate,
    endDate,
    guests,
    partnerNoteEn,
    partnerNoteDe,
    items,
    status: "proposed",
    conversations: [],
    createdAt: new Date(),
    sentAt: null,
  };
  await (await plans()).insertOne(doc);
  return { ok: true, plan: await view(doc) };
}

export async function getPlan(accountId: string, planId: string): Promise<PlanView | null> {
  if (!ObjectId.isValid(planId)) return null;
  const doc = await (await plans()).findOne({ _id: new ObjectId(planId), accountId: new ObjectId(accountId) });
  return doc ? view(doc) : null;
}

function dateLine(doc: PlanDoc, german: boolean): string | null {
  if (!doc.startDate) return null;
  const fmt = (d: string) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString(german ? "de-DE" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  const range = doc.endDate && doc.endDate !== doc.startDate ? `${fmt(doc.startDate)} ${german ? "bis" : "to"} ${fmt(doc.endDate)}` : fmt(doc.startDate);
  return german ? `Zeitraum: ${range}` : `Dates: ${range}`;
}

/**
 * The member said yes: every partner in the plan gets the request at once,
 * grouped so one partner gets one message with everything that is theirs.
 */
export async function confirmPlan(account: PublicAccount, planId: string): Promise<PlanView | null> {
  if (!ObjectId.isValid(planId)) return null;
  const accountId = new ObjectId(account.id);
  const collection = await plans();
  const doc = await collection.findOne({ _id: new ObjectId(planId), accountId });
  if (!doc) return null;
  if (doc.status === "sent") return view(doc);

  const current = await view(doc);
  const byPartner = new Map<string, typeof current.items>();
  for (const item of current.items) {
    // Products are bought in the brand's shop, not requested.
    if (item.kind === "product") continue;
    byPartner.set(item.partner.id, [...(byPartner.get(item.partner.id) ?? []), item]);
  }

  const partners = await (await partnerProfiles())
    .find({ _id: { $in: [...byPartner.keys()].map((id) => new ObjectId(id)) } }, { projection: { accountId: 1, country: 1, name: 1 } })
    .toArray();

  const conversations: PlanDoc["conversations"] = [];
  for (const partner of partners) {
    const items = byPartner.get(partner._id.toHexString()) ?? [];
    const german = GERMAN_SPEAKING.has(partner.country.trim().toLowerCase());
    const conversationId = await openConversation({ accountId, counterpartId: partner.accountId.toHexString() });
    if (!conversationId) continue;
    const note = german ? doc.partnerNoteDe : doc.partnerNoteEn;
    const body = [
      german
        ? `Anfrage über TheONE von ${account.displayName}, Teil eines Gesamtplans, den POWER AI für den Kunden zusammengestellt hat:`
        : `Request via TheONE from ${account.displayName}, part of a complete plan POWER AI arranged for the client:`,
      ...items.map((i) => `· ${i.title}`),
      dateLine(doc, german),
      doc.guests ? (german ? `Personen: ${doc.guests}` : `Guests: ${doc.guests}`) : null,
      note || null,
      german
        ? "Bitte bestätigen Sie hier die Verfügbarkeit und die nächsten Schritte."
        : "Please confirm availability and next steps here.",
    ]
      .filter(Boolean)
      .join("\n");
    await sendMessage({ conversationId, accountId, body });
    conversations.push({ partnerName: partner.name, conversationId });
  }

  await collection.updateOne(
    { _id: doc._id },
    { $set: { status: "sent", conversations, sentAt: new Date() } },
  );
  return view({ ...doc, status: "sent", conversations, sentAt: new Date() });
}
