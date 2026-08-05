import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { listMessages, sendMessage } from "@/lib/api/chat";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const messages = await listMessages({
    conversationId: id,
    accountId: new ObjectId(auth.account.id),
  });

  // Null covers both "no such conversation" and "not yours" — telling the two
  // apart would confirm a stranger's conversation exists.
  if (!messages) return apiError("not_found", 404);
  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  let body: { body?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_body", 400);
  }

  if (!body.body?.trim()) return apiError("empty_message", 400);

  const { id } = await params;
  const message = await sendMessage({
    conversationId: id,
    accountId: new ObjectId(auth.account.id),
    body: body.body,
  });

  if (!message) return apiError("not_found", 404);
  return NextResponse.json({ message });
}
