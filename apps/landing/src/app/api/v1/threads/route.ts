import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { authenticateRequest } from "@/lib/api/auth";
import { aiThreads } from "@/lib/db/collections";

/** The member's assistant history, newest first. */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const collection = await aiThreads();
  const docs = await collection
    .find({ accountId: new ObjectId(auth.account.id) })
    .sort({ updatedAt: -1 })
    .limit(30)
    .toArray();

  return NextResponse.json({
    threads: docs.map((doc) => ({
      id: doc._id.toHexString(),
      title: doc.title,
      updatedAt: doc.updatedAt.toISOString(),
      messages: doc.messages.map((entry) => ({
        role: entry.role,
        content: entry.content,
        createdAt: entry.createdAt.toISOString(),
      })),
    })),
  });
}
