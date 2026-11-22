import { ObjectId } from "mongodb";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { aiThreads } from "@/lib/db/collections";
import {
  isAssistantConfigured,
  languageTag,
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

  let body: { message?: string; threadId?: string; opening?: string; language?: unknown; mode?: unknown };
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

  // The greeting is kept on the thread, so every later turn still knows how
  // the conversation began.
  const opening =
    thread?.opening ??
    (typeof body.opening === "string"
      ? body.opening.trim().slice(0, 400) || undefined
      : undefined);

  // TheONE WISH: the conversation began with the member's wish, and stays so.
  const wish = thread?.mode === "wish" || (!thread && body.mode === "wish");

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
      // The email card is not part of the reply text, but the next turn has to
      // know what was drafted ("make it warmer"), so it is kept in the history.
      let drafted = "";
      // Likewise the plan card: a "yes" in the next turn needs its id.
      let planned = "";

      try {
        for await (const event of runAssistant({
          account: auth.account,
          history,
          message,
          opening,
          wish,
          language: languageTag(body.language),
        })) {
          if (event.type === "done") finalText = event.text;
          if (event.type === "email") {
            const d = event.draft;
            drafted = `\n\n[Email draft shown to the member as a card]\nTo: ${d.toName ?? ""}${d.toEmail ? ` <${d.toEmail}>` : ""}\nSubject: ${d.subject}\n\n${d.body}`;
          }
          if (event.type === "plan") {
            planned = `\n\n[Plan shown to the member as a card: planId ${event.plan.id}, status ${event.plan.status}]`;
          }
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
              ...(opening ? { opening } : {}),
              ...(wish ? { mode: "wish" as const } : {}),
            },
            $push: {
              messages: {
                $each: [
                  { role: "user" as const, content: message, createdAt: now },
                  {
                    role: "assistant" as const,
                    content: finalText + drafted + planned,
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
