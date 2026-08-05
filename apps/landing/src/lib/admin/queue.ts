import "server-only";
import { ObjectId, type Filter } from "mongodb";
import { applications, type ApplicationDoc } from "../db/collections";
import type {
  ApplicantType,
  ApplicationStatus,
  MemberApplicationInput,
  PartnerApplicationInput,
  PartnerTier,
} from "../domain";

export type ApplicationSummary = {
  id: string;
  type: ApplicantType;
  status: ApplicationStatus;
  displayName: string;
  email: string;
  phone: string;
  locale: "de" | "en";
  partnerTier: PartnerTier | null;
  grantedFreeMonths: number;
  viaInvitation: boolean;
  createdAt: string;
  reviewedAt: string | null;
};

export type ApplicationDetail = ApplicationSummary & {
  data: MemberApplicationInput | PartnerApplicationInput;
  internalReason: string | null;
};

function toSummary(doc: ApplicationDoc): ApplicationSummary {
  return {
    id: doc._id.toHexString(),
    type: doc.type,
    status: doc.status,
    displayName: doc.displayName,
    email: doc.email,
    phone: doc.phone,
    locale: doc.locale,
    partnerTier: doc.partnerTier,
    grantedFreeMonths: doc.grantedFreeMonths,
    viaInvitation: doc.invitationId !== null,
    createdAt: doc.createdAt.toISOString(),
    reviewedAt: doc.reviewedAt?.toISOString() ?? null,
  };
}

export async function listApplications(options?: {
  status?: ApplicationStatus;
  type?: ApplicantType;
  search?: string;
  limit?: number;
}): Promise<ApplicationSummary[]> {
  const collection = await applications();
  const filter: Filter<ApplicationDoc> = {};

  if (options?.status) filter.status = options.status;
  if (options?.type) filter.type = options.type;

  const search = options?.search?.trim();
  if (search) {
    /* Escaped before it reaches the regex: an unescaped "(" from the search box
       is a syntax error, and something like "(a+)+$" is a ReDoS. */
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(safe, "i");
    filter.$or = [{ displayName: pattern }, { email: pattern }];
  }

  /* Pending first, then newest.
     Sorting on `status` directly would order alphabetically — approved,
     declined, pending — burying the only rows that need a decision behind
     every historical one. The computed weight says what we actually mean. */
  const docs = await collection
    .aggregate<ApplicationDoc>([
      { $match: filter },
      {
        $addFields: {
          _pendingFirst: { $cond: [{ $eq: ["$status", "pending"] }, 0, 1] },
        },
      },
      { $sort: { _pendingFirst: 1, createdAt: -1 } },
      { $limit: options?.limit ?? 200 },
    ])
    .toArray();

  return docs.map(toSummary);
}

export async function getApplication(
  id: string,
): Promise<ApplicationDetail | null> {
  if (!ObjectId.isValid(id)) return null;

  const collection = await applications();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;

  return {
    ...toSummary(doc),
    data: doc.data,
    internalReason: doc.internalReason,
  };
}

export async function countByStatus(): Promise<
  Record<ApplicationStatus, number>
> {
  const collection = await applications();
  const rows = await collection
    .aggregate<{ _id: ApplicationStatus; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ])
    .toArray();

  const counts: Record<ApplicationStatus, number> = {
    pending: 0,
    approved: 0,
    declined: 0,
  };
  for (const row of rows) counts[row._id] = row.count;
  return counts;
}
