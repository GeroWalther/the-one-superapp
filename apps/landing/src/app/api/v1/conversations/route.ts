import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { listConversations, openConversation } from "@/lib/api/chat";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const conversations = await listConversations(new ObjectId(auth.account.id));
  return NextResponse.json({ conversations });
}

/** Opens (or reuses) a conversation with another account. */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  let body: { counterpartId?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_body", 400);
  }

  if (!body.counterpartId) return apiError("missing_counterpart", 400);

  const id = await openConversation({
    accountId: new ObjectId(auth.account.id),
    counterpartId: body.counterpartId,
  });

  if (!id) return apiError("not_found", 404);
  return NextResponse.json({ conversationId: id });
}
