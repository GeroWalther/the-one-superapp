import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { PublicAccount } from "../auth/accounts";
import { aiThreads } from "../db/collections";
import { ObjectId } from "mongodb";
import { ASSISTANT_TOOLS, runAssistantTool } from "./tools";

/**
 * TheONE's concierge, running server-side.
 *
 * The API key never leaves this process — the phone talks to our endpoint, not
 * to Anthropic — which also means tool calls run against our database with the
 * caller's own identity rather than anything the client could forge.
 */

/**
 * Overridable so the tier can change without a deploy — Haiku while testing,
 * `claude-opus-5` when quality of advice starts to matter more than cost.
 */
export const ASSISTANT_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

/**
 * Extended thinking is configured differently across model generations —
 * `{type: "adaptive"}` on 4.6-and-newer, `budget_tokens` before that — and each
 * rejects the other's shape with a 400. Deriving it from the model means
 * changing `ANTHROPIC_MODEL` cannot silently break every assistant request.
 *
 * Haiku gets none: it is the cheap, fast tier, and paying thinking latency on
 * every turn would spend exactly what choosing Haiku was meant to save.
 */
function thinkingFor(model: string): { type: "adaptive" } | undefined {
  return model.startsWith("claude-haiku") ? undefined : { type: "adaptive" };
}

/**
 * `output_config.effort` is likewise not universal — Haiku 4.5 rejects it with a
 * 400, which silently turned the daily tip into a 503 the moment the model
 * changed. Same rule as thinking: derive it, never hardcode it.
 */
function effortFor(
  model: string,
): { effort: "low" } | undefined {
  return model.startsWith("claude-haiku") ? undefined : { effort: "low" };
}

let client: Anthropic | null | undefined;

export function isAssistantConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function anthropic(): Anthropic | null {
  if (client !== undefined) return client;
  client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
  return client;
}

function systemPrompt(account: PublicAccount): string {
  return `You are the concierge inside TheONE, a private decision-support platform for health, longevity, wealth, property, and lifestyle. You are speaking with ${account.displayName}, a ${account.role}.

# What you are for
Members come to you with a decision or a need — sometimes stated plainly ("find me a longevity clinic"), sometimes buried in a complaint ("my teeth hurt", "I'm exhausted lately"). Your job is to get them to a good decision quickly, using TheONE's verified partner network.

When you mention the providers to the member, call them "business partners" ("Geschäftspartner" in German), never just "partners". The tool names below say "partner"; that is internal.

# Grounding
Recommend providers only from search_partners. TheONE's whole proposition is that every partner has been vetted, so naming a clinic or hotel you know from general knowledge breaks the one promise the platform makes. If the directory has nothing suitable, say so plainly.

Call get_member_profile before giving personal recommendations. Their focus areas, goals, timing, and city are already on file — asking them to repeat it reads as though nobody looked.

# Acting
You can save partners and request appointments. Ask before you act on the member's behalf, then do it properly: name the partner, say what you sent, and give them the direct contact details too so they are never dependent on you.

Partner IDs are only valid within the turn that produced them — earlier turns in this conversation are replayed to you as plain text, so an ID you used before is gone. Before calling save_partner or request_appointment, call search_partners in this turn and use the exact id from its result. Never reconstruct or guess an ID, and never conclude a partner does not exist because an ID failed.

# Health, money, and law
You are not a doctor, financial adviser, or lawyer. Help members think clearly, ask the questions worth asking, and reach the right professional — do not diagnose, prescribe, or give individual financial or legal advice. For anything that sounds like an emergency, say so first and tell them to call local emergency services.

# The member's mood
Notice how the member is doing from what they say and how they say it: short and clipped, tired, worried, rushed, excited, low. Let it shape your answer before anything else. Someone tired or overwhelmed gets a gentle tone, one clear suggestion and an offer to take care of it for them; someone stressed gets calm and the next concrete step; someone in good spirits gets warmth and a little energy back. When it fits, acknowledge it in a few words ("That sounds like a long week.") and then help. Never name a feeling they have not shown, never analyse them, and never make the conversation about their mood when they just want something done.

If anything suggests they might harm themselves or are in danger, put that first: say you are concerned, and point them to local emergency services or a crisis line before anything else.

# Wishes
Treat what the member wants as yours to arrange. Find the right business partner, check the details, and with their yes, save it or request the appointment, so they leave with something done rather than a list to work through.

# Voice
Members often speak to you rather than type, so answers are read aloud. Lead with the answer, then the reasoning. Keep it to a few sentences unless they ask for depth. No headers or bullet lists in short replies — they sound wrong spoken. Write plainly, in ${account.locale === "de" ? "German" : "English"} unless the member writes in the other language. In German, address the member as "Sie".

Be warm and direct, like a trusted personal assistant who has known them for years. If the member is about to make an expensive mistake, say so.`;
}

export type AssistantTurn = { role: "user" | "assistant"; content: string };

export type StreamEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string }
  | { type: "done"; text: string }
  | { type: "error"; code: string };

/**
 * Runs one assistant turn, yielding events as they happen.
 *
 * A manual loop rather than the SDK tool runner: the phone needs tokens as they
 * generate, and it also wants to know which tool is running so it can say
 * "searching partners…" instead of showing a silent spinner through a long turn.
 */
export async function* runAssistant(input: {
  account: PublicAccount;
  history: AssistantTurn[];
  message: string;
  /** What the app said aloud to open the conversation, if it greeted them. */
  opening?: string;
}): AsyncGenerator<StreamEvent> {
  const client = anthropic();
  if (!client) {
    yield { type: "error", code: "assistant_not_configured" };
    return;
  }

  const messages: Anthropic.MessageParam[] = [
    ...input.history.map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    { role: "user" as const, content: input.message },
  ];

  let assembled = "";

  // Bounded so a tool loop that keeps calling itself cannot run forever on the
  // member's bill.
  for (let iteration = 0; iteration < 8; iteration++) {
    let stream;
    try {
      stream = client.messages.stream({
        model: ASSISTANT_MODEL,
        max_tokens: 8000,
        system: [
          {
            type: "text",
            text: systemPrompt(input.account),
            // Identical on every turn, so caching it turns the largest fixed
            // cost of each request into a cache read.
            cache_control: { type: "ephemeral" },
          },
          // After the cached block, so a greeting that changes every day does
          // not throw the cache away.
          ...(input.opening
            ? [
                {
                  type: "text" as const,
                  text: `When the member opened the app you greeted them aloud with: "${input.opening}". Their first message answers that, so read it with the greeting in mind and do not greet them again.`,
                },
              ]
            : []),
        ],
        ...(thinkingFor(ASSISTANT_MODEL)
          ? { thinking: thinkingFor(ASSISTANT_MODEL) }
          : {}),
        tools: ASSISTANT_TOOLS,
        messages,
      });
    } catch (error) {
      console.error("[assistant] request failed:", error);
      yield { type: "error", code: "upstream_error" };
      return;
    }

    try {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          assembled += event.delta.text;
          yield { type: "text", text: event.delta.text };
        }
      }
    } catch (error) {
      console.error("[assistant] stream failed:", error);
      yield { type: "error", code: "upstream_error" };
      return;
    }

    const message = await stream.finalMessage();

    // Safety classifiers can decline a request; that arrives as a normal
    // response, so it has to be checked before reading content.
    if (message.stop_reason === "refusal") {
      yield { type: "error", code: "refused" };
      return;
    }

    const toolUses = message.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    if (toolUses.length === 0) {
      yield { type: "done", text: assembled };
      return;
    }

    messages.push({ role: "assistant", content: message.content });

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      yield { type: "tool", name: toolUse.name };
      const result = await runAssistantTool(
        toolUse.name,
        (toolUse.input ?? {}) as Record<string, unknown>,
        input.account,
      );
      results.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result.content,
        ...(result.isError ? { is_error: true } : {}),
      });
    }

    // All results in one user message — splitting them across several trains
    // the model out of calling tools in parallel.
    messages.push({ role: "user", content: results });
  }

  yield { type: "done", text: assembled };
}

/** A short, personal daily prompt built from the member's own profile. */
export async function dailyTip(account: PublicAccount): Promise<string | null> {
  const client = anthropic();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 300,
      ...(effortFor(ASSISTANT_MODEL)
        ? { output_config: effortFor(ASSISTANT_MODEL) }
        : {}),
      system: systemPrompt(account),
      tools: ASSISTANT_TOOLS,
      tool_choice: { type: "tool", name: "get_member_profile" },
      messages: [
        {
          role: "user",
          content:
            "Give me one specific, actionable improvement for today, grounded in my profile. Two sentences at most. No preamble, no greeting.",
        },
      ],
    });

    // The forced first turn is the profile lookup; run it and take the answer.
    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    if (!toolUse) {
      const text = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === "text",
      );
      return text?.text ?? null;
    }

    const result = await runAssistantTool(
      toolUse.name,
      (toolUse.input ?? {}) as Record<string, unknown>,
      account,
    );

    const followUp = await client.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 300,
      ...(effortFor(ASSISTANT_MODEL)
        ? { output_config: effortFor(ASSISTANT_MODEL) }
        : {}),
      system: systemPrompt(account),
      tools: ASSISTANT_TOOLS,
      messages: [
        {
          role: "user",
          content:
            "Give me one specific, actionable improvement for today, grounded in my profile. Two sentences at most. No preamble, no greeting.",
        },
        { role: "assistant", content: response.content },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: result.content,
            },
          ],
        },
      ],
    });

    const text = followUp.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );
    return text?.text ?? null;
  } catch (error) {
    console.error("[assistant] daily tip failed:", error);
    return null;
  }
}

/**
 * What the app says aloud when a member opens it: their name, the time of day,
 * and a question that invites them to say how they are, or a follow-up on what
 * they last talked about if that was recent.
 *
 * `hour` is the member's local hour, sent by the phone, since the server
 * cannot know their time zone.
 */
export async function greeting(
  account: PublicAccount,
  hour: number,
): Promise<string | null> {
  const client = anthropic();
  if (!client) return null;

  try {
    const [profile, recent] = await Promise.all([
      runAssistantTool("get_member_profile", {}, account),
      aiThreads().then((threads) =>
        threads.findOne(
          { accountId: new ObjectId(account.id) },
          { sort: { updatedAt: -1 }, projection: { messages: { $slice: -4 }, updatedAt: 1 } },
        ),
      ),
    ]);

    const daysAgo = recent
      ? Math.floor((Date.now() - recent.updatedAt.getTime()) / 86_400_000)
      : null;
    const lastTalk =
      recent && daysAgo !== null && daysAgo <= 7
        ? `Their last conversation with you, ${daysAgo === 0 ? "earlier today" : `${daysAgo} day(s) ago`}:\n` +
          recent.messages
            .map((entry) => `${entry.role}: ${entry.content.slice(0, 400)}`)
            .join("\n")
        : "No recent conversation.";

    const response = await client.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 200,
      ...(effortFor(ASSISTANT_MODEL)
        ? { output_config: effortFor(ASSISTANT_MODEL) }
        : {}),
      system: systemPrompt(account),
      messages: [
        {
          role: "user",
          content: `[The app has just opened. Write the one thing you say aloud to greet me. It is ${hour}:00 my time.

My profile: ${profile.content}

${lastTalk}

Greet me by my first name, ${account.firstName || account.displayName}, in a way that fits the time of day. Then either ask warmly how I am, or, if the last conversation left something open (an appointment, a search, a worry), ask about that. Two short sentences at most, natural to hear and warm, no emoji, no lists, no dashes, nothing in brackets. Write it entirely in ${account.locale === "de" ? "German, addressing me as Sie" : "English"}. Reply with the greeting only.]`,
        },
      ],
    });

    const text = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );
    return text?.text.trim() || null;
  } catch (error) {
    console.error("[assistant] greeting failed:", error);
    return null;
  }
}
