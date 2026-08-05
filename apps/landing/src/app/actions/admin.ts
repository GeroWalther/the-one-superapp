"use server";

import * as z from "zod";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import {
  AdminInviteSchema,
  ApproveSchema,
  DeclineSchema,
  type FormState,
} from "@/lib/domain";
import {
  approveApplication,
  declineApplication,
  issueActivationLink,
} from "@/lib/applications/service";
import { createInvitation, revokeInvitation } from "@/lib/admin/invitations";
import { recordAdminAction } from "@/lib/admin/audit";
import { getCurrentAccount } from "@/lib/auth/dal";
import type { Locale } from "@/lib/db/collections";

/**
 * Every action re-checks the admin role server-side. The dashboard being behind
 * a guarded layout is a UI convenience; a server action is a public endpoint
 * and has to defend itself.
 */
async function requireAdminActor() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") return null;
  return account;
}

function safeLocale(value: FormDataEntryValue | null): Locale {
  return value === "en" ? "en" : "de";
}

export async function approveApplicationAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireAdminActor();
  if (!actor) return { message: "forbidden" };

  const parsed = ApproveSchema.safeParse({
    applicationId: formData.get("applicationId"),
    partnerTier: formData.get("partnerTier") || undefined,
    note: formData.get("note") ?? "",
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  // A partner without a tier has no price, so checkout would have nothing to
  // charge. Members have exactly one plan, so a tier is meaningless for them.
  if (formData.get("type") === "partner" && !parsed.data.partnerTier) {
    return { errors: { partnerTier: ["tierRequired"] } };
  }

  const result = await approveApplication({
    applicationId: parsed.data.applicationId,
    partnerTier: parsed.data.partnerTier ?? null,
    reviewedByAccountId: new ObjectId(actor.id),
    actorEmail: actor.email,
  });

  if (!result.ok) {
    return { message: result.reason === "not_pending" ? "notPending" : "serverError" };
  }

  revalidatePath("/[locale]/admin", "layout");
  return { ok: true, message: "approved" };
}

export async function declineApplicationAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireAdminActor();
  if (!actor) return { message: "forbidden" };

  const parsed = DeclineSchema.safeParse({
    applicationId: formData.get("applicationId"),
    internalReason: formData.get("internalReason"),
    applicantMessage: formData.get("applicantMessage") ?? "",
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await declineApplication({
    applicationId: parsed.data.applicationId,
    internalReason: parsed.data.internalReason,
    applicantMessage: parsed.data.applicantMessage || undefined,
    reviewedByAccountId: new ObjectId(actor.id),
    actorEmail: actor.email,
  });

  if (!result.ok) {
    return { message: result.reason === "not_pending" ? "notPending" : "serverError" };
  }

  revalidatePath("/[locale]/admin", "layout");
  return { ok: true, message: "declined" };
}

export async function createAdminInvitationAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireAdminActor();
  if (!actor) return { message: "forbidden" };

  const locale = safeLocale(formData.get("locale"));

  const parsed = AdminInviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    note: formData.get("note") ?? "",
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createInvitation({
    kind: "admin",
    role: parsed.data.role,
    email: parsed.data.email,
    locale,
    inviterAccountId: new ObjectId(actor.id),
    inviterName: null,
    actorEmail: actor.email,
    note: parsed.data.note || undefined,
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

  revalidatePath("/[locale]/admin/invitations", "page");
  return { ok: true, message: "invitationSent" };
}

export async function revokeInvitationAction(formData: FormData): Promise<void> {
  const actor = await requireAdminActor();
  if (!actor) return;

  await revokeInvitation({
    invitationId: String(formData.get("invitationId") ?? ""),
    actorAccountId: new ObjectId(actor.id),
    actorEmail: actor.email,
  });

  revalidatePath("/[locale]/admin/invitations", "page");
}

/**
 * Reveals a fresh activation link for an approved application.
 *
 * The reviewer needs this whenever the email did not arrive — most obviously
 * before a mail provider is configured at all, when every approval would
 * otherwise dead-end. Admin-gated, and it re-checks the role rather than
 * trusting that the button was only rendered for admins.
 */
export async function revealActivationLinkAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireAdminActor();
  if (!actor) return { message: "forbidden" };

  const applicationId = String(formData.get("applicationId") ?? "");
  const activationUrl = await issueActivationLink(applicationId);
  if (!activationUrl) return { message: "serverError" };

  await recordAdminAction({
    actorAccountId: new ObjectId(actor.id),
    actorEmail: actor.email,
    action: "application.activationLinkReissued",
    targetType: "application",
    targetId: new ObjectId(applicationId),
    detail: null,
  });

  return { ok: true, activationUrl };
}
