import "server-only";
import { ObjectId, type Filter } from "mongodb";
import {
  partnerProfiles,
  savedPartners,
  type PartnerProfileDoc,
} from "../db/collections";

/** The shape the app consumes. Contact details are part of the value. */
export type PartnerSummary = {
  id: string;
  name: string;
  category: string;
  focusArea: string;
  city: string;
  country: string;
  description: string;
  images: string[];
  saved: boolean;
};

export type PartnerDetail = PartnerSummary & {
  targetClientele: string | null;
  street: string | null;
  postalCode: string | null;
  website: string | null;
  contactEmail: string;
  contactPhone: string;
  accountId: string;
};

function toSummary(doc: PartnerProfileDoc, saved: boolean): PartnerSummary {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    category: doc.category,
    focusArea: doc.focusArea,
    city: doc.city,
    country: doc.country,
    description: doc.description,
    images: doc.images,
    saved,
  };
}

export async function searchPartners(input: {
  accountId: ObjectId;
  query?: string;
  category?: string;
  focusArea?: string;
  city?: string;
  savedOnly?: boolean;
  limit?: number;
}): Promise<PartnerSummary[]> {
  const collection = await partnerProfiles();
  const savedCollection = await savedPartners();

  const savedDocs = await savedCollection
    .find({ accountId: input.accountId })
    .toArray();
  const savedIds = new Set(
    savedDocs.map((doc) => doc.partnerProfileId.toHexString()),
  );

  const filter: Filter<PartnerProfileDoc> = { published: true };
  if (input.category) filter.category = input.category as PartnerProfileDoc["category"];
  if (input.focusArea) filter.focusArea = input.focusArea;

  if (input.savedOnly) {
    filter._id = { $in: savedDocs.map((doc) => doc.partnerProfileId) };
  }

  /* Escaped before it reaches a regex: an unescaped "(" from the search box is
     a syntax error, and "(a+)+$" is a denial of service. */
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (input.city) filter.city = new RegExp(`^${escape(input.city.trim())}`, "i");

  const query = input.query?.trim();
  if (query) {
    const pattern = new RegExp(escape(query), "i");
    filter.$or = [
      { name: pattern },
      { description: pattern },
      { city: pattern },
    ];
  }

  const docs = await collection
    .find(filter)
    .sort({ name: 1 })
    .limit(input.limit ?? 60)
    .toArray();

  return docs.map((doc) => toSummary(doc, savedIds.has(doc._id.toHexString())));
}

export async function getPartner(input: {
  accountId: ObjectId;
  partnerId: string;
}): Promise<PartnerDetail | null> {
  if (!ObjectId.isValid(input.partnerId)) return null;

  const collection = await partnerProfiles();
  const doc = await collection.findOne({
    _id: new ObjectId(input.partnerId),
    published: true,
  });
  if (!doc) return null;

  const savedCollection = await savedPartners();
  const saved = await savedCollection.findOne({
    accountId: input.accountId,
    partnerProfileId: doc._id,
  });

  return {
    ...toSummary(doc, saved !== null),
    targetClientele: doc.targetClientele,
    street: doc.street,
    postalCode: doc.postalCode,
    website: doc.website,
    contactEmail: doc.contactEmail,
    contactPhone: doc.contactPhone,
    accountId: doc.accountId.toHexString(),
  };
}

export async function setSaved(input: {
  accountId: ObjectId;
  partnerId: string;
  saved: boolean;
}): Promise<boolean> {
  if (!ObjectId.isValid(input.partnerId)) return false;
  const collection = await savedPartners();
  const partnerProfileId = new ObjectId(input.partnerId);

  if (input.saved) {
    // Upsert rather than insert: saving twice is a double-tap, not an error.
    await collection.updateOne(
      { accountId: input.accountId, partnerProfileId },
      { $setOnInsert: { _id: new ObjectId(), createdAt: new Date() } },
      { upsert: true },
    );
  } else {
    await collection.deleteOne({ accountId: input.accountId, partnerProfileId });
  }

  return true;
}
