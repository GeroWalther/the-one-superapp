import "server-only";
import { ObjectId } from "mongodb";
import {
  accounts,
  applications,
  partnerProfiles,
  type MemberProfile,
} from "../db/collections";
import {
  CATEGORY_TO_FOCUS,
  type MemberProfileInput,
  type PartnerProfileInput,
} from "../domain";

/**
 * Profile reads and writes.
 *
 * The rule throughout: an application is what was submitted and reviewed, and
 * it is never rewritten. Edits go to the account (members) or the public
 * listing (partners), and reads prefer the edit while falling back to the
 * original answers — so a member who has never opened the profile page still
 * gets personalised advice from what they told us at enrolment.
 */

export type MemberProfileView = MemberProfileInput & {
  email: string;
  username: string;
  /** True once the member has edited; false while these are enrolment answers. */
  edited: boolean;
};

export async function getMemberProfile(
  accountId: string,
): Promise<MemberProfileView | null> {
  if (!ObjectId.isValid(accountId)) return null;

  const account = await (
    await accounts()
  ).findOne({ _id: new ObjectId(accountId) });
  if (!account) return null;

  const base = {
    email: account.email,
    username: account.username,
    displayName: account.displayName,
  };

  if (account.profile) {
    return {
      ...base,
      country: account.profile.country ?? "",
      city: account.profile.city ?? "",
      focusAreas: account.profile.focusAreas as MemberProfileInput["focusAreas"],
      goal: account.profile.goal as MemberProfileInput["goal"],
      context: account.profile.context ?? "",
      edited: true,
    };
  }

  // Never edited — fall back to what they said when they applied.
  const application = account.applicationId
    ? await (await applications()).findOne({ _id: account.applicationId })
    : await (
        await applications()
      ).findOne({ email: account.email, type: "member" });

  const data = application?.data as
    | {
        country?: string;
        city?: string;
        focusAreas?: string[];
        goal?: string;
        context?: string;
      }
    | undefined;

  return {
    ...base,
    country: data?.country ?? "",
    city: data?.city ?? "",
    focusAreas: (data?.focusAreas ?? []) as MemberProfileInput["focusAreas"],
    goal: (data?.goal ?? "clarity") as MemberProfileInput["goal"],
    context: data?.context ?? "",
    edited: false,
  };
}

export async function updateMemberProfile(
  accountId: string,
  input: MemberProfileInput,
): Promise<boolean> {
  if (!ObjectId.isValid(accountId)) return false;

  const profile: MemberProfile = {
    city: input.city,
    country: input.country,
    focusAreas: [...input.focusAreas],
    goal: input.goal,
    context: input.context || null,
    updatedAt: new Date(),
  };

  const result = await (
    await accounts()
  ).updateOne(
    { _id: new ObjectId(accountId), role: "member" },
    {
      $set: {
        displayName: input.displayName,
        profile,
        updatedAt: new Date(),
      },
    },
  );

  return result.matchedCount > 0;
}

/* ========================================================================== *
 * Partners
 * ========================================================================== */

export async function getPartnerProfileFor(accountId: string) {
  if (!ObjectId.isValid(accountId)) return null;
  return (await partnerProfiles()).findOne({
    accountId: new ObjectId(accountId),
  });
}

export async function updatePartnerProfile(
  accountId: string,
  input: PartnerProfileInput,
): Promise<boolean> {
  if (!ObjectId.isValid(accountId)) return false;

  const result = await (
    await partnerProfiles()
  ).updateOne(
    { accountId: new ObjectId(accountId) },
    {
      $set: {
        name: input.name,
        category: input.category,
        /* Kept in step with the category: members search by focus area, so a
           clinic that re-files itself as a resort would otherwise stay filed
           under health and never surface for wellness. */
        focusArea: CATEGORY_TO_FOCUS[input.category],
        description: input.description,
        targetClientele: input.targetClientele || null,
        street: input.street,
        postalCode: input.postalCode,
        city: input.city,
        country: input.country,
        website: input.website || null,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        published: input.published,
        updatedAt: new Date(),
      },
    },
  );

  return result.matchedCount > 0;
}

/** Replaces the image list. Callers pass the full ordered set, not a delta. */
export async function setPartnerImages(
  accountId: string,
  images: string[],
): Promise<boolean> {
  if (!ObjectId.isValid(accountId)) return false;

  const result = await (
    await partnerProfiles()
  ).updateOne(
    { accountId: new ObjectId(accountId) },
    { $set: { images, updatedAt: new Date() } },
  );

  return result.matchedCount > 0;
}
