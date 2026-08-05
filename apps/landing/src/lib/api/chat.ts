import "server-only";
import { ObjectId } from "mongodb";
import {
  accounts,
  conversations,
  messages,
  partnerProfiles,
  type ConversationDoc,
} from "../db/collections";

/**
 * In-app messaging between members and partners.
 *
 * Conversations are keyed on a sorted participant pair, so opening a chat twice
 * from either side lands in the same thread rather than creating a duplicate.
 */

export type ConversationSummary = {
  id: string;
  counterpartId: string;
  counterpartName: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  unread: boolean;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  mine: boolean;
  createdAt: string;
};

function sortedPair(a: ObjectId, b: ObjectId): ObjectId[] {
  return [a, b].sort((x, y) => (x.toHexString() < y.toHexString() ? -1 : 1));
}

export async function openConversation(input: {
  accountId: ObjectId;
  counterpartId: string;
}): Promise<string | null> {
  if (!ObjectId.isValid(input.counterpartId)) return null;

  const counterpart = new ObjectId(input.counterpartId);
  if (counterpart.equals(input.accountId)) return null;

  const exists = await (await accounts()).findOne(
    { _id: counterpart },
    { projection: { _id: 1 } },
  );
  if (!exists) return null;

  const collection = await conversations();
  const participantIds = sortedPair(input.accountId, counterpart);

  const doc = await collection.findOneAndUpdate(
    { participantIds },
    {
      $setOnInsert: {
        _id: new ObjectId(),
        participantIds,
        lastMessageAt: new Date(),
        lastMessagePreview: "",
        createdAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  return doc?._id.toHexString() ?? null;
}

async function displayNamesFor(ids: ObjectId[]): Promise<Map<string, string>> {
  const [accountDocs, profileDocs] = await Promise.all([
    (await accounts())
      .find({ _id: { $in: ids } }, { projection: { displayName: 1, role: 1 } })
      .toArray(),
    (await partnerProfiles())
      .find({ accountId: { $in: ids } }, { projection: { accountId: 1, name: 1 } })
      .toArray(),
  ]);

  const names = new Map<string, string>();
  for (const doc of accountDocs) names.set(doc._id.toHexString(), doc.displayName);
  // A partner's public brand name beats their legal entity name in a chat list.
  for (const doc of profileDocs) names.set(doc.accountId.toHexString(), doc.name);

  return names;
}

export async function listConversations(
  accountId: ObjectId,
): Promise<ConversationSummary[]> {
  const collection = await conversations();
  const docs = await collection
    .find({ participantIds: accountId })
    .sort({ lastMessageAt: -1 })
    .limit(100)
    .toArray();

  const counterpartIds = docs
    .map((doc) => doc.participantIds.find((id) => !id.equals(accountId)))
    .filter((id): id is ObjectId => Boolean(id));

  const names = await displayNamesFor(counterpartIds);

  const messagesCollection = await messages();
  const unreadIds = new Set(
    (
      await messagesCollection
        .find({
          conversationId: { $in: docs.map((doc) => doc._id) },
          senderId: { $ne: accountId },
          readBy: { $ne: accountId },
        })
        .project<{ conversationId: ObjectId }>({ conversationId: 1 })
        .toArray()
    ).map((row) => row.conversationId.toHexString()),
  );

  return docs.map((doc: ConversationDoc) => {
    const counterpart = doc.participantIds.find((id) => !id.equals(accountId));
    const counterpartId = counterpart?.toHexString() ?? "";
    return {
      id: doc._id.toHexString(),
      counterpartId,
      counterpartName: names.get(counterpartId) ?? "—",
      lastMessagePreview: doc.lastMessagePreview,
      lastMessageAt: doc.lastMessageAt.toISOString(),
      unread: unreadIds.has(doc._id.toHexString()),
    };
  });
}

/** Membership is checked on every read and write — an id is not an entitlement. */
async function assertParticipant(
  conversationId: string,
  accountId: ObjectId,
): Promise<ConversationDoc | null> {
  if (!ObjectId.isValid(conversationId)) return null;
  const collection = await conversations();
  return collection.findOne({
    _id: new ObjectId(conversationId),
    participantIds: accountId,
  });
}

export async function listMessages(input: {
  conversationId: string;
  accountId: ObjectId;
}): Promise<ChatMessage[] | null> {
  const conversation = await assertParticipant(
    input.conversationId,
    input.accountId,
  );
  if (!conversation) return null;

  const collection = await messages();
  const docs = await collection
    .find({ conversationId: conversation._id })
    .sort({ createdAt: 1 })
    .limit(300)
    .toArray();

  await collection.updateMany(
    { conversationId: conversation._id, readBy: { $ne: input.accountId } },
    { $addToSet: { readBy: input.accountId } },
  );

  return docs.map((doc) => ({
    id: doc._id.toHexString(),
    senderId: doc.senderId.toHexString(),
    body: doc.body,
    mine: doc.senderId.equals(input.accountId),
    createdAt: doc.createdAt.toISOString(),
  }));
}

export async function sendMessage(input: {
  conversationId: string;
  accountId: ObjectId;
  body: string;
}): Promise<ChatMessage | null> {
  const body = input.body.trim();
  if (!body || body.length > 4000) return null;

  const conversation = await assertParticipant(
    input.conversationId,
    input.accountId,
  );
  if (!conversation) return null;

  const collection = await messages();
  const now = new Date();
  const doc = {
    _id: new ObjectId(),
    conversationId: conversation._id,
    senderId: input.accountId,
    body,
    readBy: [input.accountId],
    createdAt: now,
  };

  await collection.insertOne(doc);

  await (
    await conversations()
  ).updateOne(
    { _id: conversation._id },
    {
      $set: {
        lastMessageAt: now,
        lastMessagePreview: body.slice(0, 140),
      },
    },
  );

  return {
    id: doc._id.toHexString(),
    senderId: input.accountId.toHexString(),
    body,
    mine: true,
    createdAt: now.toISOString(),
  };
}
