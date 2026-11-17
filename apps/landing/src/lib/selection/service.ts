import "server-only";
import { ObjectId, type Filter } from "mongodb";
import {
  accounts,
  offerings,
  partnerProfiles,
  skinScans,
  type OfferingDoc,
  type PartnerProfileDoc,
} from "../db/collections";
import { getMemberProfile } from "../profile/service";
import { openConversation, sendMessage } from "../api/chat";

/**
 * TheONE SELECTION: what TheONE has chosen for this member, not a market.
 *
 * Each area shows at most three business partners, from the member's own city
 * where it matters (a doctor, a clinic, a hotel nearby); skincare travels and
 * is not tied to a city. On top, "chosen for you" brings the exact products
 * and treatments their latest skin analysis and profile point to.
 */

type Section = {
  key: string;
  categories: readonly string[];
  focus?: readonly string[];
  /** Ranked by the member's own city first: doctors, clinics, brokers. */
  local: boolean;
  /** Only these kinds of offering are shown in this area. */
  kinds?: readonly OfferingDoc["kind"][];
};

/**
 * Each TheONE function is its own area. TheONE SELECTION is only companies
 * with products to buy; clinics, hotels and brokers live in their own.
 */
export const AREAS: Record<string, readonly Section[]> = {
  selection: [
    { key: "skincare", categories: ["beauty"], local: false, kinds: ["product"] },
    { key: "products", categories: ["clinic", "practice", "wellness", "hotel", "resort", "other", "insurance", "realEstate"], local: false, kinds: ["product"] },
  ],
  longevity: [{ key: "longevity", categories: ["clinic"], local: true }],
  health: [
    { key: "prevention", categories: ["practice"], focus: ["health"], local: true },
    { key: "wellnessClinics", categories: ["wellness"], local: true },
  ],
  hotels: [{ key: "hotels", categories: ["hotel", "resort"], local: false, kinds: ["stay"] }],
  // TheONE TRAVEL is flights only, from whichever partner offers them.
  travel: [
    { key: "flights", categories: [], local: false, kinds: ["flight"] },
    { key: "concierge", categories: [], focus: ["lifestyle"], local: false, kinds: ["service"] },
  ],
  realestate: [{ key: "realestate", categories: ["realEstate"], local: true }],
};

const PER_SECTION = 3;

export type OfferingView = {
  id: string;
  kind: OfferingDoc["kind"];
  title: string;
  description: string;
  priceCents: number | null;
  currency: string;
  priceNote: string | null;
  imageUrl: string | null;
  concerns: string[];
  partner: { id: string; name: string; category: string; city: string };
};

export type SelectionPartner = {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string;
  description: string;
  images: string[];
  offerings: OfferingView[];
};

export type SelectionFeed = {
  forYou: (OfferingView & { reason: string | null; basis: "skin" | "profile" })[];
  sections: { key: string; partners: SelectionPartner[] }[];
};

function offeringView(o: OfferingDoc, p: PartnerProfileDoc): OfferingView {
  return {
    id: o._id.toHexString(),
    kind: o.kind,
    title: o.title,
    description: o.description,
    priceCents: o.priceCents,
    currency: o.currency,
    priceNote: o.priceNote,
    imageUrl: o.imageUrl,
    concerns: o.concerns,
    partner: { id: p._id.toHexString(), name: p.name, category: p.category, city: p.city },
  };
}

async function isTest(accountId: string): Promise<boolean> {
  const raw = (await (await accounts()).findOne(
    { _id: new ObjectId(accountId) },
    { projection: { isTestAccount: 1 } },
  )) as { isTestAccount?: boolean } | null;
  return raw?.isTestAccount === true;
}

/** Seeded test partners and their offerings are shown to test accounts only. */
function visibleTo(test: boolean) {
  return test ? {} : { isTestAccount: { $ne: true } };
}

export async function selectionFeed(accountId: string, area = "selection"): Promise<SelectionFeed> {
  const SECTIONS = AREAS[area] ?? AREAS.selection;
  const test = await isTest(accountId);
  const city = (await getMemberProfile(accountId))?.city?.trim().toLowerCase() ?? "";

  const partners = await (await partnerProfiles())
    .find({ published: true, ...visibleTo(test) } as Filter<PartnerProfileDoc>)
    .toArray();
  const byId = new Map(partners.map((p) => [p._id.toHexString(), p]));

  const allOfferings = await (await offerings())
    .find({
      published: true,
      partnerProfileId: { $in: partners.map((p) => p._id) },
    })
    .sort({ createdAt: 1 })
    .toArray();
  const offeringsOf = new Map<string, OfferingDoc[]>();
  for (const o of allOfferings) {
    const key = o.partnerProfileId.toHexString();
    offeringsOf.set(key, [...(offeringsOf.get(key) ?? []), o]);
  }

  const sections = SECTIONS.map((section) => {
    // Only partners with something to offer: SELECTION shows what can be
    // bought, booked or asked for, not a directory.
    const offered = (p: PartnerProfileDoc) =>
      (offeringsOf.get(p._id.toHexString()) ?? []).filter(
        (o) => !section.kinds || section.kinds.includes(o.kind),
      );
    const fits = partners.filter(
      (p) =>
        offered(p).length > 0 &&
        (section.categories.length === 0 || section.categories.includes(p.category)) &&
        (!section.focus || section.focus.includes(p.focusArea)),
    );
    // The member's own city first where it matters; then the rest, so an
    // area is never empty just because their city has no partner yet.
    const ranked = fits.sort((a, b) => {
      const ah = section.local && city && a.city.trim().toLowerCase() === city ? 0 : 1;
      const bh = section.local && city && b.city.trim().toLowerCase() === city ? 0 : 1;
      return ah - bh || a.name.localeCompare(b.name);
    });
    return {
      key: section.key,
      partners: ranked.slice(0, PER_SECTION).map((p) => ({
        id: p._id.toHexString(),
        name: p.name,
        category: p.category,
        city: p.city,
        country: p.country,
        description: p.description,
        images: p.images,
        offerings: offered(p).map((o) => offeringView(o, p)),
      })),
    };
  }).filter((s) => s.partners.length > 0);

  // "Chosen for you" belongs to TheONE SELECTION: products only.
  if (area !== "selection") return { forYou: [], sections };
  const products = allOfferings.filter((o) => o.kind === "product");

  // Chosen for you: the latest skin reading first (its own product picks,
  // then whatever helps its two weakest scores), otherwise one offering from
  // each area the member said matters to them.
  const forYou: SelectionFeed["forYou"] = [];
  const seen = new Set<string>();
  const add = (o: OfferingDoc, reason: string | null, basis: "skin" | "profile") => {
    const p = byId.get(o.partnerProfileId.toHexString());
    if (!p || seen.has(o._id.toHexString())) return;
    seen.add(o._id.toHexString());
    forYou.push({ ...offeringView(o, p), reason, basis });
  };

  const scan = await (await skinScans()).findOne(
    { accountId: new ObjectId(accountId) },
    { sort: { createdAt: -1 } },
  );
  if (scan) {
    const byOffering = new Map(products.map((o) => [o._id.toHexString(), o]));
    for (const pick of scan.offerings ?? []) {
      const o = byOffering.get(pick.offeringId.toHexString());
      if (o) add(o, pick.reason, "skin");
    }
    const weakest = [...scan.scores].sort((a, b) => a.score - b.score).slice(0, 2).map((s) => s.key);
    for (const o of products) {
      if (forYou.length >= 6) break;
      if (o.concerns.some((c) => weakest.includes(c))) add(o, null, "skin");
    }
  }
  if (forYou.length < 4) {
    for (const section of sections) {
      const first = section.partners[0]?.offerings[0];
      const doc = first && products.find((o) => o._id.toHexString() === first.id);
      if (doc) add(doc, null, "profile");
      if (forYou.length >= 6) break;
    }
  }

  return { forYou, sections };
}

/** Offerings the assistant and the skin analysis may name, with partner. */
export async function offeringsForAdvice(input: {
  accountId: string;
  concerns?: string[];
  kinds?: OfferingDoc["kind"][];
  limit?: number;
}): Promise<OfferingView[]> {
  const test = await isTest(input.accountId);
  const partners = await (await partnerProfiles())
    .find({ published: true, ...visibleTo(test) } as Filter<PartnerProfileDoc>)
    .toArray();
  const byId = new Map(partners.map((p) => [p._id.toHexString(), p]));
  const filter: Filter<OfferingDoc> = {
    published: true,
    partnerProfileId: { $in: partners.map((p) => p._id) },
    ...(input.concerns?.length ? { concerns: { $in: input.concerns } } : {}),
    ...(input.kinds?.length ? { kind: { $in: input.kinds } } : {}),
  };
  const docs = await (await offerings()).find(filter).limit(input.limit ?? 60).toArray();
  return docs.flatMap((o) => {
    const p = byId.get(o.partnerProfileId.toHexString());
    return p ? [offeringView(o, p)] : [];
  });
}

const GERMAN_SPEAKING = new Set(["germany", "deutschland", "austria", "österreich", "switzerland", "schweiz", "liechtenstein"]);

/**
 * A member asks for an offering: a conversation with the partner opens with
 * the request already in it, in the partner's working language.
 */
export async function requestOffering(input: {
  accountId: string;
  displayName: string;
  offeringId: string;
}): Promise<{ conversationId: string; partnerName: string } | null> {
  if (!ObjectId.isValid(input.offeringId)) return null;
  const offering = await (await offerings()).findOne({ _id: new ObjectId(input.offeringId), published: true });
  if (!offering) return null;
  const partner = await (await partnerProfiles()).findOne({ _id: offering.partnerProfileId, published: true });
  if (!partner) return null;
  if ((partner as { isTestAccount?: boolean }).isTestAccount && !(await isTest(input.accountId))) return null;

  const accountId = new ObjectId(input.accountId);
  const conversationId = await openConversation({
    accountId,
    counterpartId: partner.accountId.toHexString(),
  });
  if (!conversationId) return null;

  const german = GERMAN_SPEAKING.has(partner.country.trim().toLowerCase());
  const body = german
    ? `Anfrage über TheONE SELECTION von ${input.displayName}: ${offering.title}. Bitte melden Sie sich mit Verfügbarkeit und den nächsten Schritten.`
    : `Request via TheONE SELECTION from ${input.displayName}: ${offering.title}. Please reply with availability and next steps.`;
  await sendMessage({ conversationId, accountId, body });

  return { conversationId, partnerName: partner.name };
}
