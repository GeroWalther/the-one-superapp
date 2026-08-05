import "server-only";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import {
  accounts,
  invitations,
  type InvitationDoc,
  type Locale,
} from "../db/collections";
import {
  ADMIN_INVITE_FREE_MONTHS,
  INVITATION_TTL_DAYS,
  normaliseEmail,
} from "../domain";
import { sendMailSafely } from "../mail/mailer";
import { invitationEmail } from "../mail/templates";
import { siteUrl } from "../urls";
import { recordAdminAction } from "./audit";

/**
 * Invitations come in two flavours that differ in who did the vetting:
 *
 * - `admin` — issued by an administrator. Skips the review queue and carries
 *   free months, because the admin has already decided.
 * - `referral` — issued by a live member or partner. Still queues for review;
 *   a member vouching for someone is a signal, not a decision.
 */

export type CreateInvitationOutcome =
  | { ok: true; code: string }
  | { ok: false; reason: "already_invited" | "already_member" | "error" };

function newCode(): string {
  return randomBytes(16).toString("base64url");
}

export async function createInvitation(input: {
  kind: InvitationDoc["kind"];
  role: "member" | "partner";
  email: string;
  locale: Locale;
  inviterAccountId?: ObjectId | null;
  inviterName?: string | null;
  actorEmail: string;
  note?: string;
}): Promise<CreateInvitationOutcome> {
  const email = normaliseEmail(input.email);

  try {
    // Inviting somebody who already has an account wastes a free-month grant
    // and confuses the recipient.
    const existingAccount = await (await accounts()).findOne(
      { email },
      { projection: { _id: 1 } },
    );
    if (existingAccount) return { ok: false, reason: "already_member" };

    const collection = await invitations();

    const outstanding = await collection.findOne({
      invitedEmail: email,
      status: "sent",
      expiresAt: { $gt: new Date() },
    });
    if (outstanding) return { ok: false, reason: "already_invited" };

    const grantsFreeMonths =
      input.kind === "admin" ? ADMIN_INVITE_FREE_MONTHS : 0;

    const doc: InvitationDoc = {
      _id: new ObjectId(),
      code: newCode(),
      kind: input.kind,
      role: input.role,
      invitedEmail: email,
      inviterAccountId: input.inviterAccountId ?? null,
      inviterName: input.inviterName ?? null,
      grantsFreeMonths,
      status: "sent",
      note: input.note?.trim() || null,
      applicationId: null,
      redeemedByAccountId: null,
      createdAt: new Date(),
      expiresAt: new Date(INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000 + Date.now()),
      redeemedAt: null,
    };

    await collection.insertOne(doc);

    if (input.kind === "admin") {
      await recordAdminAction({
        actorAccountId: input.inviterAccountId ?? null,
        actorEmail: input.actorEmail,
        action: "invitation.created",
        targetType: "invitation",
        targetId: doc._id,
        detail: `${input.role} → ${email}`,
      });
    }

    await sendMailSafely(
      invitationEmail({
        locale: input.locale,
        to: email,
        kind: doc.kind,
        role: doc.role,
        inviterName: doc.inviterName ?? undefined,
        inviteUrl: siteUrl(
          `/${input.locale}/enroll?invite=${encodeURIComponent(doc.code)}`,
        ),
        freeMonths: grantsFreeMonths,
        expiresInDays: INVITATION_TTL_DAYS,
      }),
    );

    return { ok: true, code: doc.code };
  } catch (error) {
    console.error("[invitations] create failed:", error);
    return { ok: false, reason: "error" };
  }
}

export async function revokeInvitation(input: {
  invitationId: string;
  actorAccountId: ObjectId | null;
  actorEmail: string;
  /** Referrers may only revoke their own invitations. */
  restrictToInviter?: ObjectId | null;
}): Promise<boolean> {
  if (!ObjectId.isValid(input.invitationId)) return false;

  const collection = await invitations();
  const filter: Record<string, unknown> = {
    _id: new ObjectId(input.invitationId),
    status: "sent",
  };
  if (input.restrictToInviter) {
    filter.inviterAccountId = input.restrictToInviter;
  }

  const doc = await collection.findOneAndUpdate(filter, {
    $set: { status: "revoked" },
  });

  if (!doc) return false;

  await recordAdminAction({
    actorAccountId: input.actorAccountId,
    actorEmail: input.actorEmail,
    action: "invitation.revoked",
    targetType: "invitation",
    targetId: doc._id,
    detail: doc.invitedEmail,
  });

  return true;
}

export type InvitationSummary = {
  id: string;
  code: string;
  kind: InvitationDoc["kind"];
  role: "member" | "partner";
  invitedEmail: string;
  inviterName: string | null;
  status: InvitationDoc["status"];
  grantsFreeMonths: number;
  createdAt: string;
  expiresAt: string;
};

function toSummary(doc: InvitationDoc): InvitationSummary {
  return {
    id: doc._id.toHexString(),
    code: doc.code,
    kind: doc.kind,
    role: doc.role,
    invitedEmail: doc.invitedEmail,
    inviterName: doc.inviterName,
    status: doc.expiresAt <= new Date() && doc.status === "sent" ? "expired" : doc.status,
    grantsFreeMonths: doc.grantsFreeMonths,
    createdAt: doc.createdAt.toISOString(),
    expiresAt: doc.expiresAt.toISOString(),
  };
}

export async function listInvitations(options?: {
  inviterAccountId?: ObjectId;
  limit?: number;
}): Promise<InvitationSummary[]> {
  const collection = await invitations();
  const filter = options?.inviterAccountId
    ? { inviterAccountId: options.inviterAccountId }
    : {};

  const docs = await collection
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(options?.limit ?? 100)
    .toArray();

  return docs.map(toSummary);
}
