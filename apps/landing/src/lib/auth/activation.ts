import "server-only";
import { ObjectId } from "mongodb";
import {
  applications,
  entitlementGrants,
  type ApplicationDoc,
} from "../db/collections";
import {
  UsernameTakenError,
  createAccount,
  isUsernameAvailable,
  type PublicAccount,
} from "./accounts";
import { consumeToken, peekToken, releaseToken } from "./tokens";

/**
 * Turns an approved application into a real account.
 *
 * This is the only place an account with a password comes into existence
 * outside the admin seed script — the intake form deliberately never asks for
 * one, because nobody should choose credentials for an account that may never
 * be approved.
 */

export type ActivationTarget = {
  applicationId: string;
  displayName: string;
  email: string;
  type: "member" | "partner";
  freeMonths: number;
};

/** Reads the token for rendering the form, without spending it. */
export async function inspectActivationToken(
  raw: string,
): Promise<ActivationTarget | null> {
  const token = await peekToken(raw, "activation");
  if (!token?.applicationId) return null;

  const collection = await applications();
  const application = await collection.findOne({ _id: token.applicationId });
  if (!application || application.status !== "approved") return null;

  return {
    applicationId: application._id.toHexString(),
    displayName: application.displayName,
    email: application.email,
    type: application.type,
    freeMonths: application.grantedFreeMonths,
  };
}

export type ActivationOutcome =
  | { ok: true; account: PublicAccount }
  | {
      ok: false;
      reason: "invalid_token" | "username_taken" | "already_activated" | "error";
    };

export async function activateAccount(input: {
  token: string;
  username: string;
  password: string;
}): Promise<ActivationOutcome> {
  try {
    // Cheap pre-check so the common case fails before the token is spent.
    if (!(await isUsernameAvailable(input.username))) {
      return { ok: false, reason: "username_taken" };
    }

    const token = await consumeToken(input.token, "activation");
    if (!token?.applicationId) return { ok: false, reason: "invalid_token" };

    const collection = await applications();
    const application = await collection.findOne({ _id: token.applicationId });

    if (!application || application.status !== "approved") {
      await releaseToken(token._id);
      return { ok: false, reason: "invalid_token" };
    }

    try {
      const account = await createAccount({
        applicationId: application._id,
        role: application.type,
        // Approved but not yet paid. Only Stripe moves an account to `active`.
        status: "awaiting_payment",
        username: input.username,
        email: application.email,
        password: input.password,
        displayName: application.displayName,
        locale: application.locale,
        partnerTier: application.partnerTier,
        freeMonthsGranted: application.grantedFreeMonths,
        invitedByAccountId: application.inviterAccountId,
      });

      if (application.grantedFreeMonths > 0) {
        await recordEntitlement({
          accountId: new ObjectId(account.id),
          freeMonths: application.grantedFreeMonths,
          reason: "admin_invite",
          detail: "Invitation issued by an administrator",
        });
      }

      return { ok: true, account };
    } catch (error) {
      // Someone claimed the username between the pre-check and the insert.
      // Hand the token back so this person can pick another name.
      await releaseToken(token._id);
      if (error instanceof UsernameTakenError) {
        return { ok: false, reason: "username_taken" };
      }
      // An account already exists for this email — the link was used before.
      return { ok: false, reason: "already_activated" };
    }
  } catch (error) {
    console.error("[activation] failed:", error);
    return { ok: false, reason: "error" };
  }
}

export async function recordEntitlement(input: {
  accountId: ObjectId;
  freeMonths: number;
  reason: "admin_invite" | "referral_tier" | "manual";
  detail?: string;
  referralCount?: number;
}): Promise<void> {
  const collection = await entitlementGrants();
  await collection.insertOne({
    _id: new ObjectId(),
    accountId: input.accountId,
    freeMonths: input.freeMonths,
    reason: input.reason,
    detail: input.detail ?? null,
    referralCount: input.referralCount ?? null,
    createdAt: new Date(),
  });
}

export type { ApplicationDoc };
