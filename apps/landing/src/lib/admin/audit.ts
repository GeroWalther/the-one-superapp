import "server-only";
import { ObjectId } from "mongodb";
import { adminAuditLog, type AdminAuditDoc } from "../db/collections";

/**
 * Every administrative decision is recorded. Approvals and declines determine
 * whether someone gets access and whether they are permanently blocked, so
 * "who decided this, and why" has to be answerable months later.
 *
 * Writing the log must never fail the decision it describes — a lost audit line
 * is bad, a half-applied decision is worse.
 */
export async function recordAdminAction(input: {
  actorAccountId: ObjectId | null;
  actorEmail: string;
  action: AdminAuditDoc["action"];
  targetType: AdminAuditDoc["targetType"];
  targetId: ObjectId;
  detail?: string | null;
}): Promise<void> {
  try {
    const collection = await adminAuditLog();
    await collection.insertOne({
      _id: new ObjectId(),
      actorAccountId: input.actorAccountId,
      actorEmail: input.actorEmail,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      detail: input.detail ?? null,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[audit] failed to record admin action:", error);
  }
}
