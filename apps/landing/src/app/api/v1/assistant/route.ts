import { ObjectId } from "mongodb";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { aiThreads } from "@/lib/db/collections";
import {
  isAssistantConfigured,
  runAssistant,
  type AssistantTurn,
} from "@/lib/ai/assistant";

/**
 * Streams an assistant turn as Server-Sent Events.
 *
 * SSE rather than a single JSON response because a grounded answer can involve
 * several tool round-trips; without streaming the app shows a spinner for many
 * seconds with no idea whether anything is happening.
 */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  if (!isAssistantConfigured()) {
    return apiError("assistant_not_configured", 503);
  }

  let body: { message?: string; threadId?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_body", 400);
  }

  const message = body.message?.trim();
  if (!message) return apiError("empty_message", 400);
  if (message.length > 4000) return apiError("message_too_long", 400);

  const accountId = new ObjectId(auth.account.id);
  const threads = await aiThreads();

  const thread =
    body.threadId && ObjectId.isValid(body.threadId)
      ? await threads.findOne({ _id: new ObjectId(body.threadId), accountId })
      : null;

  const history: AssistantTurn[] = (thread?.messages ?? []).map((entry) => ({
    role: entry.role,
    content: entry.content,
  }));

  const threadId = thread?._id ?? new ObjectId();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );

      send({ type: "thread", threadId: threadId.toHexString() });

      let finalText = "";

      try {
        for await (const event of runAssistant({
          account: auth.account,
          history,
          message,
        })) {
          if (event.type === "done") finalText = event.text;
          send(event);
        }
      } catch (error) {
        console.error("[assistant] stream aborted:", error);
        send({ type: "error", code: "upstream_error" });
      }

      // Persist only a completed turn: half a reply in the history would be
      // replayed as though the assistant had actually said it.
      if (finalText) {
        const now = new Date();
        await threads.updateOne(
          { _id: threadId, accountId },
          {
            $setOnInsert: {
              accountId,
              title: message.slice(0, 60),
              createdAt: now,
            },
            $push: {
              messages: {
                $each: [
                  { role: "user" as const, content: message, createdAt: now },
                  {
                    role: "assistant" as const,
                    content: finalText,
                    createdAt: new Date(),
                  },
                ],
              },
            },
            $set: { updatedAt: new Date() },
          },
          { upsert: true },
        );
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      // Without this some proxies buffer the whole response and the stream
      // arrives as one lump at the end, defeating the point.
      "x-accel-buffering": "no",
    },
  });
}
