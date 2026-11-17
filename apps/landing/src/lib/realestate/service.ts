import "server-only";
import { ObjectId, type Filter } from "mongodb";
import {
  partnerProfiles,
  propertySales,
  propertySearches,
  type PartnerProfileDoc,
  type PropertySaleDoc,
  type PropertySearchDoc,
} from "../db/collections";
import { openConversation, sendMessage } from "../api/chat";
import { GERMAN_SPEAKING, isTest, visibleTo } from "../selection/service";

/**
 * TheONE REAL ESTATE, selling: a member tells TheONE about their home once,
 * and it goes to the two or three best brokers for that place, each in a
 * conversation of its own, written in the broker's language. The member
 * then talks to the brokers directly; TheONE never sits in between.
 */

export const PROPERTY_TYPES = ["villa", "house", "apartment", "penthouse", "chalet", "estate", "plot"] as const;
const TIMINGS = ["now", "months", "exploring"] as const;
const PER_DAY = 5;
const BROKERS = 3;

export type PropertySaleInput = {
  propertyType: string;
  city: string;
  country: string;
  rooms?: number | null;
  livingArea?: number | null;
  plotArea?: number | null;
  priceIdea?: number | null;
  currency?: string;
  description?: string;
  timing?: string;
  offMarket?: boolean;
};

export type PropertySaleView = {
  id: string;
  propertyType: string;
  city: string;
  country: string;
  rooms: number | null;
  livingArea: number | null;
  plotArea: number | null;
  priceIdeaCents: number | null;
  currency: string;
  description: string;
  timing: string;
  offMarket: boolean;
  brokers: { id: string; name: string; city: string; conversationId: string }[];
  createdAt: string;
};

function view(doc: PropertySaleDoc): PropertySaleView {
  return {
    id: doc._id.toHexString(),
    propertyType: doc.propertyType,
    city: doc.city,
    country: doc.country,
    rooms: doc.rooms,
    livingArea: doc.livingArea,
    plotArea: doc.plotArea,
    priceIdeaCents: doc.priceIdeaCents,
    currency: doc.currency,
    description: doc.description,
    timing: doc.timing,
    offMarket: doc.offMarket,
    brokers: doc.brokers.map((b) => ({
      id: b.partnerProfileId.toHexString(),
      name: b.name,
      city: b.city,
      conversationId: b.conversationId,
    })),
    createdAt: doc.createdAt.toISOString(),
  };
}

const positive = (v: unknown, max: number) =>
  typeof v === "number" && Number.isFinite(v) && v > 0 && v <= max ? Math.round(v) : null;

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** The best brokers for a place: same city, then same country, then the rest. */
async function brokersFor(city: string, country: string, test: boolean): Promise<PartnerProfileDoc[]> {
  const all = await (await partnerProfiles())
    .find({ published: true, category: "realEstate", ...visibleTo(test) } as Filter<PartnerProfileDoc>)
    .toArray();
  const c = city.toLowerCase();
  const k = country.toLowerCase();
  const rank = (p: PartnerProfileDoc) =>
    p.city.trim().toLowerCase() === c ? 0 : p.country.trim().toLowerCase() === k ? 1 : 2;
  const ranked = all.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  // Brokers who know the place come first; only when there are none does the
  // sale go to the best brokers TheONE has elsewhere.
  const local = ranked.filter((p) => rank(p) < 2);
  return (local.length > 0 ? local : ranked).slice(0, BROKERS);
}

const TYPE_DE: Record<string, string> = {
  villa: "Villa", house: "Haus", apartment: "Wohnung", penthouse: "Penthouse",
  chalet: "Chalet", estate: "Anwesen", plot: "Grundstück",
};

function brokerMessage(doc: Omit<PropertySaleDoc, "_id" | "brokers">, member: string, german: boolean): string {
  const money = doc.priceIdeaCents
    ? `${Math.round(doc.priceIdeaCents / 100).toLocaleString(german ? "de-CH" : "en-GB")} ${doc.currency}`
    : null;
  if (german) {
    const facts = [
      `${TYPE_DE[doc.propertyType] ?? doc.propertyType} in ${doc.city}, ${doc.country}`,
      doc.rooms ? `${doc.rooms} Zimmer` : null,
      doc.livingArea ? `${doc.livingArea} m² Wohnfläche` : null,
      doc.plotArea ? `${doc.plotArea} m² Grundstück` : null,
      money ? `Preisvorstellung ${money}` : null,
    ].filter(Boolean).join(", ");
    const when = { now: "möchte jetzt verkaufen", months: "möchte in den nächsten Monaten verkaufen", exploring: "möchte zunächst den Wert kennen" }[doc.timing];
    return [
      `Verkaufsanfrage über TheONE REAL ESTATE von ${member}: ${facts}.`,
      doc.description ? `In den Worten des Eigentümers: ${doc.description}` : null,
      `Der Eigentümer ${when}${doc.offMarket ? " und wünscht einen diskreten Verkauf, off market" : ""}.`,
      "Bitte melden Sie sich hier mit einer ersten Einschätzung und einem Terminvorschlag für eine Besichtigung.",
    ].filter(Boolean).join("\n\n");
  }
  const facts = [
    `${doc.propertyType} in ${doc.city}, ${doc.country}`,
    doc.rooms ? `${doc.rooms} rooms` : null,
    doc.livingArea ? `${doc.livingArea} m² living space` : null,
    doc.plotArea ? `${doc.plotArea} m² plot` : null,
    money ? `price idea ${money}` : null,
  ].filter(Boolean).join(", ");
  const when = { now: "would like to sell now", months: "would like to sell within the coming months", exploring: "would first like to know the value" }[doc.timing];
  return [
    `Sale request via TheONE REAL ESTATE from ${member}: ${facts}.`,
    doc.description ? `In the owner's words: ${doc.description}` : null,
    `The owner ${when}${doc.offMarket ? " and asks for a discreet, off market sale" : ""}.`,
    "Please reply here with a first assessment and a suggested date for a viewing.",
  ].filter(Boolean).join("\n\n");
}

export type SaleResult =
  | { ok: true; sale: PropertySaleView }
  | { ok: false; reason: "invalid" | "limit" | "no_brokers" };

export async function startPropertySale(input: {
  accountId: string;
  displayName: string;
  property: PropertySaleInput;
}): Promise<SaleResult> {
  const p = input.property;
  const propertyType = clean(p.propertyType, 20).toLowerCase();
  const city = clean(p.city, 80);
  const country = clean(p.country, 80);
  if (!(PROPERTY_TYPES as readonly string[]).includes(propertyType) || !city || !country) {
    return { ok: false, reason: "invalid" };
  }

  const accountId = new ObjectId(input.accountId);
  const sales = await propertySales();
  const today = await sales.countDocuments({
    accountId,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  if (today >= PER_DAY) return { ok: false, reason: "limit" };

  const test = await isTest(input.accountId);
  const brokers = await brokersFor(city, country, test);
  if (brokers.length === 0) return { ok: false, reason: "no_brokers" };

  const timing = (TIMINGS as readonly string[]).includes(String(p.timing)) ? (p.timing as PropertySaleDoc["timing"]) : "now";
  const priceIdea = positive(p.priceIdea, 10_000_000_000);
  const base: Omit<PropertySaleDoc, "_id" | "brokers"> = {
    accountId,
    propertyType,
    city,
    country,
    rooms: positive(p.rooms, 200),
    livingArea: positive(p.livingArea, 100_000),
    plotArea: positive(p.plotArea, 10_000_000),
    priceIdeaCents: priceIdea ? priceIdea * 100 : null,
    currency: /^[A-Z]{3}$/.test(String(p.currency ?? "")) ? String(p.currency) : "EUR",
    description: clean(p.description, 1500),
    timing,
    offMarket: p.offMarket === true,
    createdAt: new Date(),
  };

  const reached: PropertySaleDoc["brokers"] = [];
  for (const broker of brokers) {
    const conversationId = await openConversation({ accountId, counterpartId: broker.accountId.toHexString() });
    if (!conversationId) continue;
    const german = GERMAN_SPEAKING.has(broker.country.trim().toLowerCase());
    await sendMessage({ conversationId, accountId, body: brokerMessage(base, input.displayName, german) });
    reached.push({ partnerProfileId: broker._id, name: broker.name, city: broker.city, conversationId });
  }
  if (reached.length === 0) return { ok: false, reason: "no_brokers" };

  const doc: PropertySaleDoc = { _id: new ObjectId(), ...base, brokers: reached };
  await sales.insertOne(doc);
  return { ok: true, sale: view(doc) };
}

export async function listPropertySales(accountId: string): Promise<PropertySaleView[]> {
  const docs = await (await propertySales())
    .find({ accountId: new ObjectId(accountId) })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();
  return docs.map(view);
}

// ---------------------------------------------------------------------------
// Buying: the brokers have the portfolio and look for clients. A member says
// once what they are looking for, and the best brokers for that place answer
// with the right properties, including those never publicly listed.

export type PropertySearchInput = {
  propertyTypes?: string[];
  city: string;
  country: string;
  minRooms?: number | null;
  minLivingArea?: number | null;
  budget?: number | null;
  currency?: string;
  description?: string;
  timing?: string;
};

export type PropertySearchView = {
  id: string;
  propertyTypes: string[];
  city: string;
  country: string;
  brokers: { id: string; name: string; city: string; conversationId: string }[];
  createdAt: string;
};

function searchView(doc: PropertySearchDoc): PropertySearchView {
  return {
    id: doc._id.toHexString(),
    propertyTypes: doc.propertyTypes,
    city: doc.city,
    country: doc.country,
    brokers: doc.brokers.map((b) => ({
      id: b.partnerProfileId.toHexString(),
      name: b.name,
      city: b.city,
      conversationId: b.conversationId,
    })),
    createdAt: doc.createdAt.toISOString(),
  };
}

function searchMessage(doc: Omit<PropertySearchDoc, "_id" | "brokers">, member: string, german: boolean): string {
  const money = doc.budgetCents
    ? `${Math.round(doc.budgetCents / 100).toLocaleString(german ? "de-CH" : "en-GB")} ${doc.currency}`
    : null;
  const types = doc.propertyTypes.length
    ? doc.propertyTypes.map((t) => (german ? TYPE_DE[t] ?? t : t)).join(german ? " oder " : " or ")
    : german ? "Immobilie" : "property";
  if (german) {
    const facts = [
      `${types} in ${doc.city}, ${doc.country}`,
      doc.minRooms ? `ab ${doc.minRooms} Zimmern` : null,
      doc.minLivingArea ? `ab ${doc.minLivingArea} m² Wohnfläche` : null,
      money ? `Budget bis ${money}` : null,
    ].filter(Boolean).join(", ");
    const when = { now: "möchte jetzt kaufen", months: "möchte in den nächsten Monaten kaufen", exploring: "schaut sich zunächst um" }[doc.timing];
    return [
      `Suchauftrag über TheONE REAL ESTATE von ${member}: ${facts}.`,
      doc.description ? `In den Worten des Kunden: ${doc.description}` : null,
      `Der Kunde ${when}.`,
      "Bitte senden Sie hier passende Objekte aus Ihrem Portfolio, gerne auch off market, und einen Vorschlag für Besichtigungen.",
    ].filter(Boolean).join("\n\n");
  }
  const facts = [
    `${types} in ${doc.city}, ${doc.country}`,
    doc.minRooms ? `at least ${doc.minRooms} rooms` : null,
    doc.minLivingArea ? `at least ${doc.minLivingArea} m² living space` : null,
    money ? `budget up to ${money}` : null,
  ].filter(Boolean).join(", ");
  const when = { now: "would like to buy now", months: "would like to buy within the coming months", exploring: "is looking around for now" }[doc.timing];
  return [
    `Search request via TheONE REAL ESTATE from ${member}: ${facts}.`,
    doc.description ? `In the client's words: ${doc.description}` : null,
    `The client ${when}.`,
    "Please send matching properties from your portfolio here, off market ones too, and suggest dates for viewings.",
  ].filter(Boolean).join("\n\n");
}

export type SearchResult =
  | { ok: true; search: PropertySearchView }
  | { ok: false; reason: "invalid" | "limit" | "no_brokers" };

export async function startPropertySearch(input: {
  accountId: string;
  displayName: string;
  wish: PropertySearchInput;
}): Promise<SearchResult> {
  const w = input.wish;
  const city = clean(w.city, 80);
  const country = clean(w.country, 80);
  if (!city || !country) return { ok: false, reason: "invalid" };
  const propertyTypes = (Array.isArray(w.propertyTypes) ? w.propertyTypes : [])
    .map((t) => clean(t, 20).toLowerCase())
    .filter((t) => (PROPERTY_TYPES as readonly string[]).includes(t))
    .slice(0, 4);

  const accountId = new ObjectId(input.accountId);
  const searches = await propertySearches();
  const today = await searches.countDocuments({
    accountId,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  if (today >= PER_DAY) return { ok: false, reason: "limit" };

  const brokers = await brokersFor(city, country, await isTest(input.accountId));
  if (brokers.length === 0) return { ok: false, reason: "no_brokers" };

  const budget = positive(w.budget, 10_000_000_000);
  const base: Omit<PropertySearchDoc, "_id" | "brokers"> = {
    accountId,
    propertyTypes,
    city,
    country,
    minRooms: positive(w.minRooms, 200),
    minLivingArea: positive(w.minLivingArea, 100_000),
    budgetCents: budget ? budget * 100 : null,
    currency: /^[A-Z]{3}$/.test(String(w.currency ?? "")) ? String(w.currency) : "EUR",
    description: clean(w.description, 1500),
    timing: (TIMINGS as readonly string[]).includes(String(w.timing)) ? (w.timing as PropertySearchDoc["timing"]) : "now",
    createdAt: new Date(),
  };

  const reached: PropertySearchDoc["brokers"] = [];
  for (const broker of brokers) {
    const conversationId = await openConversation({ accountId, counterpartId: broker.accountId.toHexString() });
    if (!conversationId) continue;
    const german = GERMAN_SPEAKING.has(broker.country.trim().toLowerCase());
    await sendMessage({ conversationId, accountId, body: searchMessage(base, input.displayName, german) });
    reached.push({ partnerProfileId: broker._id, name: broker.name, city: broker.city, conversationId });
  }
  if (reached.length === 0) return { ok: false, reason: "no_brokers" };

  const doc: PropertySearchDoc = { _id: new ObjectId(), ...base, brokers: reached };
  await searches.insertOne(doc);
  return { ok: true, search: searchView(doc) };
}

export async function listPropertySearches(accountId: string): Promise<PropertySearchView[]> {
  const docs = await (await propertySearches())
    .find({ accountId: new ObjectId(accountId) })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();
  return docs.map(searchView);
}
