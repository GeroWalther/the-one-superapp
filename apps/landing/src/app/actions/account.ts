"use server";

import * as z from "zod";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { ReferralInviteSchema, type FormState } from "@/lib/domain";
import { createInvitation, revokeInvitation } from "@/lib/admin/invitations";
import { getCurrentAccount } from "@/lib/auth/dal";
import { RATE_LIMITS, checkRateLimit } from "@/lib/rate-limit";
import type { Locale } from "@/lib/db/collections";

function safeLocale(value: FormDataEntryValue | null): Locale {
  return value === "en" ? "en" : "de";
}

/**
 * Member and partner referrals.
 *
 * Unlike an admin invitation these do not skip the review queue — a member
 * vouching for someone is a signal, not a decision — and they grant the invitee
 * nothing. The reward accrues to the referrer, and only once the person they
 * brought in actually goes live.
 */
export async function createReferralInvitationAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const account = await getCurrentAccount();
  if (!account) return { message: "notSignedIn" };

  // Only live accounts may refer. An unpaid account handing out invitations
  // would be a free way to farm reward months.
  if (account.status !== "active") return { message: "notActive" };

  const locale = safeLocale(formData.get("locale"));

  const parsed = ReferralInviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const limited = await checkRateLimit(
    `invite:account:${account.id}`,
    RATE_LIMITS.invitation,
  );
  if (!limited.ok) return { message: "rateLimited" };

  const result = await createInvitation({
    kind: "referral",
    role: parsed.data.role,
    email: parsed.data.email,
    locale,
    inviterAccountId: new ObjectId(account.id),
    inviterName: account.displayName,
    actorEmail: account.email,
  });

  if (!result.ok) {
    return {
      message:
        result.reason === "already_member"
          ? "alreadyMember"
          : result.reason === "already_invited"
            ? "alreadyInvited"
            : "serverError",
    };
  }

  revalidatePath("/[locale]/account", "page");
  return { ok: true, message: "invitationSent" };
}

export async function revokeOwnInvitationAction(
  formData: FormData,
): Promise<void> {
  const account = await getCurrentAccount();
  if (!account) return;

  await revokeInvitation({
    invitationId: String(formData.get("invitationId") ?? ""),
    actorAccountId: new ObjectId(account.id),
    actorEmail: account.email,
    // Scoped to their own invitations: without this, any signed-in member
    // could revoke anyone else's by guessing an id.
    restrictToInviter: new ObjectId(account.id),
  });

  revalidatePath("/[locale]/account", "page");
}
