import "server-only";
import { ObjectId } from "mongodb";
import {
  applications,
  blocklist,
  invitations,
  keyedHash,
  type ApplicationDoc,
  type InvitationDoc,
  type Locale,
} from "../db/collections";
import {
  ADMIN_INVITE_FREE_MONTHS,
  normaliseEmail,
  normalisePhone,
  type ApplicationInput,
  type PartnerTier,
} from "../domain";
import { ACTIVATION_TTL_DAYS, issueToken } from "../auth/tokens";
import { sendMailSafely } from "../mail/mailer";
import {
  applicationApprovedEmail,
  applicationReceivedEmail,
} from "../mail/templates";
import { siteUrl } from "../urls";

/**
 * The application lifecycle: submit → (admin review) → approve.
 *
 * Decline lives alongside this in the admin phase; approval is here because an
 * admin-issued invitation approves on submit and must take exactly the same
 * path, rather than a parallel one that drifts.
 */

export type SubmitOutcome =
  | { ok: true; applicationId: string; autoApproved: boolean }
  | { ok: false; reason: "blocked" | "duplicate" | "invalid_invite" | "error" };

/* ========================================================================== *
 * Blocklist
 * ========================================================================== */

/** A declined applicant must not get back in by changing their email address. */
async function isBlocked(email: string, phone: string): Promise<boolean> {
  const collection = await blocklist();
  const hit = await collection.findOne({
    $or: [
      { kind: "email", hash: keyedHash(email) },
      { kind: "phone", hash: keyedHash(phone) },
    ],
  });
  return hit !== null;
}

/* ========================================================================== *
 * Invitations
 * ========================================================================== */

/**
 * Invitations are bound to the address they were sent to, so a forwarded or
 * leaked link cannot be redeemed by a third party — which matters because an
 * admin invitation carries a year of free access.
 */
async function resolveInvitation(
  code: string,
  email: string,
  type: "member" | "partner",
): Promise<InvitationDoc | null> {
  const collection = await invitations();
  const invitation = await collection.findOne({ code: code.trim() });

  if (!invitation) return null;
  if (invitation.status !== "sent") return null;
  if (invitation.expiresAt <= new Date()) return null;
  if (invitation.invitedEmail !== email) return null;
  // A member invitation must not be spent on a partner application — the two
  // carry different prices and different vetting.
  if (invitation.role !== type) return null;

  return invitation;
}

export type PublicInvitation = {
  kind: InvitationDoc["kind"];
  role: "member" | "partner";
  inviterName: string | null;
  grantsFreeMonths: number;
};

/**
 * What an invitation link may reveal before the applicant proves who they are.
 *
 * Notably absent: the invited email address. Anyone holding the code already
 * received the email, but a forwarded link should not hand a third party
 * someone else's address — and the submitted email has to match anyway.
 */
export async function lookupInvitation(
  code: string,
): Promise<PublicInvitation | null> {
  const collection = await invitations();
  const invitation = await collection.findOne({ code: code.trim() });

  if (!invitation) return null;
  if (invitation.status !== "sent") return null;
  if (invitation.expiresAt <= new Date()) return null;

  return {
    kind: invitation.kind,
    role: invitation.role,
    inviterName: invitation.inviterName,
    grantsFreeMonths: invitation.grantsFreeMonths,
  };
}

/* ========================================================================== *
 * Submit
 * ========================================================================== */

export async function submitApplication(input: {
  application: ApplicationInput;
  locale: Locale;
}): Promise<SubmitOutcome> {
  const { application, locale } = input;

  const email = normaliseEmail(application.email);
  const phone = normalisePhone(application.phone);
  const displayName =
    application.type === "member"
      ? application.fullName
      : application.companyName;

  try {
    if (await isBlocked(email, phone)) {
      return { ok: false, reason: "blocked" };
    }

    const collection = await applications();

    // One open application per address. Without this, a refresh-happy applicant
    // fills the admin queue with copies of the same submission.
    const existing = await collection.findOne({
      email,
      status: { $in: ["pending", "approved"] },
    });
    if (existing) return { ok: false, reason: "duplicate" };

    let invitation: InvitationDoc | null = null;
    const code = application.inviteCode?.trim();
    if (code) {
      invitation = await resolveInvitation(code, email, application.type);
      if (!invitation) return { ok: false, reason: "invalid_invite" };
    }

    // An admin issued the invitation, so the vetting already happened — the
    // applicant should not queue behind people the admin has not met.
    const autoApproved = invitation?.kind === "admin";
    const grantedFreeMonths =
      invitation?.kind === "admin"
        ? (invitation.grantsFreeMonths ?? ADMIN_INVITE_FREE_MONTHS)
        : 0;

    const doc: ApplicationDoc = {
      _id: new ObjectId(),
      type: application.type,
      status: autoApproved ? "approved" : "pending",
      email,
      phone,
      emailHash: keyedHash(email),
      phoneHash: keyedHash(phone),
      displayName,
      locale,
      data: application,
      invitationId: invitation?._id ?? null,
      inviterAccountId: invitation?.inviterAccountId ?? null,
      partnerTier: null,
      grantedFreeMonths,
      reviewedAt: autoApproved ? new Date() : null,
      reviewedByAccountId: null,
      internalReason: null,
      createdAt: new Date(),
    };

    await collection.insertOne(doc);

    if (invitation) {
      await (
        await invitations()
      ).updateOne(
        { _id: invitation._id, status: "sent" },
        {
          $set: {
            status: "redeemed",
            redeemedAt: new Date(),
            applicationId: doc._id,
          },
        },
      );
    }

    if (autoApproved) {
      await sendApprovalEmail(doc);
    } else {
      await sendMailSafely(
        applicationReceivedEmail({
          locale,
          to: email,
          name: displayName,
          type: application.type,
        }),
      );
    }

    return {
      ok: true,
      applicationId: doc._id.toHexString(),
      autoApproved,
    };
  } catch (error) {
    console.error("[applications] submit failed:", error);
    return { ok: false, reason: "error" };
  }
}

/* ========================================================================== *
 * Approve
 * ========================================================================== */

/**
 * Issues the single-use activation link and emails it. Shared by the admin
 * dashboard and by admin-invitation auto-approval so both produce an identical
 * account state.
 */
export async function sendApprovalEmail(doc: ApplicationDoc): Promise<void> {
  const token = await issueToken({
    purpose: "activation",
    applicationId: doc._id,
    ttlMs: ACTIVATION_TTL_DAYS * 24 * 60 * 60 * 1000,
  });

  await sendMailSafely(
    applicationApprovedEmail({
      locale: doc.locale,
      to: doc.email,
      name: doc.displayName,
      activationUrl: siteUrl(
        `/${doc.locale}/activate?token=${encodeURIComponent(token)}`,
      ),
      freeMonths: doc.grantedFreeMonths,
      expiresInDays: ACTIVATION_TTL_DAYS,
    }),
  );
}

export async function approveApplication(input: {
  applicationId: string;
  partnerTier?: PartnerTier | null;
  reviewedByAccountId: ObjectId | null;
}): Promise<{ ok: boolean; reason?: string }> {
  if (!ObjectId.isValid(input.applicationId)) {
    return { ok: false, reason: "not_found" };
  }

  const collection = await applications();

  const doc = await collection.findOneAndUpdate(
    { _id: new ObjectId(input.applicationId), status: "pending" },
    {
      $set: {
        status: "approved",
        partnerTier: input.partnerTier ?? null,
        reviewedAt: new Date(),
        reviewedByAccountId: input.reviewedByAccountId,
      },
    },
    { returnDocument: "after" },
  );

  if (!doc) return { ok: false, reason: "not_pending" };

  await sendApprovalEmail(doc);
  return { ok: true };
}
