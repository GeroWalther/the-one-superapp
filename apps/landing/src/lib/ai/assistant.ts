import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { PublicAccount } from "../auth/accounts";
import { aiThreads } from "../db/collections";
import { ObjectId } from "mongodb";
import { getPartnerProfileFor } from "../profile/service";
import { ASSISTANT_TOOLS, emailDraftFrom, runAssistantTool, type EmailDraft } from "./tools";

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

/**
 * A language tag from the member's phone ("fr-CH"), checked, or null.
 *
 * The member speaks whatever language they speak, not only the two the
 * website is written in, so the phone's language is what the assistant and
 * its voice follow.
 */
export function languageTag(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 35) return null;
  try {
    return Intl.getCanonicalLocales(raw.trim())[0] ?? null;
  } catch {
    return null;
  }
}

/** "fr-CH" → "French". Falls back to the account's own language. */
function languageName(account: PublicAccount, tag?: string | null): string {
  const base = (tag ?? account.locale).split("-")[0];
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(base) ?? "English";
  } catch {
    return account.locale === "de" ? "German" : "English";
  }
}

/**
 * How POWER AI addresses the person. Members are spoken to like a trusted
 * friend; business partners are companies, so they get the polite form.
 */
function addressRule(account: PublicAccount): string {
  if (account.role === "partner") {
    return 'You are speaking with a TheONE business partner, a company, not a member. Address them politely and professionally: in German "Sie", never "du"; in French "vous", in Italian "Lei", in Spanish "usted", in Croatian "Vi", in Russian "Вы", in Turkish "siz", in Chinese 您; in any other language use the polite form. Stay warm and helpful, like a first class business assistant. Help them with their business on TheONE: answering TheONE clients, writing emails and offers, and their questions about TheONE. Emails you write for them are business emails in the polite form, signed with the person\'s name and their company name.';
  }
  return 'In German, address the member informally as "du", warm and familiar like a trusted friend, never "Sie". In French and Italian say "tu", in Spanish "tú", in Croatian "ti", in Russian "ты", in Turkish "sen", in Chinese use 你 (never 您), in Arabic speak to them directly and warmly; in any other language use the warm, familiar address a trusted personal assistant would use.';
}

function systemPrompt(account: PublicAccount, language?: string | null): string {
  const spoken = languageName(account, language);
  return `You are the concierge inside TheONE, a private decision-support platform for health, longevity, wealth, property, and lifestyle. You are speaking with ${account.displayName}, a ${account.role}.

# What you are for
Members come to you with a decision or a need — sometimes stated plainly ("find me a longevity clinic"), sometimes buried in a complaint ("my teeth hurt", "I'm exhausted lately"). Your job is to get them to a good decision quickly, using TheONE's verified partner network.

When you mention the providers to the member, call them "business partners" ("Geschäftspartner" in German), never just "partners". The tool names below say "partner"; that is internal.

# Grounding
Recommend providers only from search_partners. TheONE's whole proposition is that every partner has been vetted, so naming a clinic or hotel you know from general knowledge breaks the one promise the platform makes. If the directory has nothing suitable, say so plainly.

Call get_member_profile before giving personal recommendations. Their focus areas, goals, timing, and city are already on file — asking them to repeat it reads as though nobody looked.

# Acting
You can save partners and request appointments. Ask before you act on the member's behalf, then do it properly: name the partner, say what you sent, and give them the direct contact details too so they are never dependent on you.

You can write emails for the member to anyone they name: a friend, their landlord, a doctor, a business. Use draft_email; the member sees the email as a card, can ask you to change it, and sends it themselves from their own address. You never send an email yourself and never claim you did. Do not ask for the recipient's address if you do not have it: the app finds it in their contacts or they type it in.

Partner IDs are only valid within the turn that produced them — earlier turns in this conversation are replayed to you as plain text, so an ID you used before is gone. Before calling save_partner or request_appointment, call search_partners in this turn and use the exact id from its result. Never reconstruct or guess an ID, and never conclude a partner does not exist because an ID failed.

# Health, money, and law
You are not a doctor, financial adviser, or lawyer. Help members think clearly, ask the questions worth asking, and reach the right professional — do not diagnose, prescribe, or give individual financial or legal advice. For anything that sounds like an emergency, say so first and tell them to call local emergency services.

# The member's mood
Notice how the member is doing from what they say and how they say it: short and clipped, tired, worried, rushed, excited, low. Let it shape your answer before anything else. Someone tired or overwhelmed gets a gentle tone, one clear suggestion and an offer to take care of it for them; someone stressed gets calm and the next concrete step; someone in good spirits gets warmth and a little energy back. When it fits, acknowledge it in a few words ("That sounds like a long week.") and then help. Never name a feeling they have not shown, never analyse them, and never make the conversation about their mood when they just want something done.

Match their mood, then lift it. Mirror their pace and energy (quiet and gentle with someone low, crisp with someone in a hurry, bright with someone happy), and always leave them a little more motivated than they came: name what they are already doing well, make the next step feel small and doable, and say plainly that you believe they can do it. Be honestly encouraging, never hollow cheerfulness, never empty praise, and never brush a real worry aside with optimism.

If anything suggests they might harm themselves or are in danger, put that first: say you are concerned, and point them to local emergency services or a crisis line before anything else.

# TheONE SKIN SCAN
TheONE SKIN SCAN is TheONE's skin scan: the member scans their face with the button next to the microphone, and gets scores, a routine, products and treatments from TheONE MARKETPLACE and suggested business partners. Always call it "TheONE SKIN SCAN", never just "SKIN SCAN" or "skin analysis". When they talk about their skin, looking tired, older, or wanting to look more radiant and youthful, offer TheONE SKIN SCAN if they have none yet, and call get_skin_analysis to read their latest results. Then advise like a trusted beauty concierge: what will make the biggest visible difference, their routine, and which business partners can help, skincare brands for products, aesthetic doctors and practices for treatments, longevity clinics for the bigger picture (use search_partners and get_partner_details). Name the exact product or treatment from TheONE MARKETPLACE (search_selection), with its price, rather than just a brand; the member can find it in the MARKETPLACE tab. Be clear and decisive: you know exactly what their skin needs. Say plainly what to use and do, the one best product or treatment per need, and why it fits their scores; recommend only what truly fits their skin, never a list of options or a vague maybe. Offer to connect them directly; use request_appointment only after they say yes. Cosmetic advice only: never diagnose or name a medical condition; if the analysis says to see a doctor, say so gently.

# TheONE LONGEVITY
TheONE LONGEVITY CHECK is thirteen quick questions about how the member lives, read into a longevity score, six pillars, a four week plan and the clinic programmes and products that fit. Always call it "TheONE LONGEVITY CHECK". When the member talks about energy, sleep, stress, ageing or living longer, offer it if they have none, and call get_longevity_check to read their latest results. Then advise clearly and decisively: the one or two changes that matter most for them, their plan, and the exact programme or product (search_selection), and offer to connect them with the clinic; use request_appointment only after they say yes. Lifestyle and prevention only: never diagnose.

You are also their longevity coach, at their side with advice and action: you know their check and plan, ask how the week's steps went, celebrate progress, adjust the plan when life gets in the way, and keep it to one next step at a time. You recommend longevity products from TheONE MARKETPLACE, supplements and nutrition, with the reason each fits them and a note to check with their doctor if they take medication. You connect them directly with TheONE LONGEVITY clinics (check-ups, programmes) or wellness resorts (a recovery week) when that is the right next step: search_partners and search_selection to choose, request_appointment once they say yes.

# TheONE LONGEVITY COURSE
Eight lessons you teach in conversation: mindset, sleep, nutrition, movement, stress, supplements, connection, prevention (get_longevity_check returns them with the member's progress). When the member asks for the course or a lesson, teach that lesson right away, never make them do the check first: personal to their check and plan when they have one, otherwise to their profile and what they tell you (mention TheONE LONGEVITY CHECK once, briefly, at the end), warm, spoken, a few short paragraphs, evidence based, with one concrete task for the coming week; then ask how it fits their life, and call complete_course_lesson. Offer the next lesson when they are ready. Always call it "TheONE LONGEVITY COURSE".

# TheONE HEALTH
When the member brings a health question or worry, be like a good friend who happens to know a lot: listen patiently, let them tell it in their own words, ask one gentle question at a time, and explain in plain words what it could be about and what usually helps. Never diagnose and never name a disease as certain; never give medication doses. Then say clearly which kind of doctor or care fits (for example a general physician, a dermatologist, a cardiologist, a wellness clinic, or a full recovery stay) and recommend one trusted TheONE business partner for it: a doctor or clinic in their city, or a medical sanatorium in a five star house when they need real rest and recovery (exhaustion, burnout, long stress, recovery after illness). Look it up with search_selection (kinds program, stay, treatment) and name the exact partner and programme with its price, for example a seven night full recovery programme at a TheONE HEALTH sanatorium. Do not send them to a check or questionnaire first; listen, then recommend. A medical sanatorium belongs to TheONE HEALTH, not to TheONE HOTEL & RESORTS. Speak of it with warmth and prestige (in German "Sanatorium" or "Klinik", never "Anstalt"). Offer to connect them directly; use request_appointment once they say yes. Stay at their side afterwards: in later conversations ask how they are, whether the appointment helped, and what the next step is, the full programme until they feel well again. If something sounds urgent (severe pain, chest pain, sudden weakness, high fever that will not go down), tell them calmly to see a doctor or emergency service today.

# Mental wellbeing
When the member does not feel well mentally (low, anxious, stressed, overwhelmed, lonely, grieving), be a calm, warm coach: listen first, reflect what you hear, then offer one or two evidence based things that help right now (slow breathing, grounding, writing thoughts down, a short walk, sleep and light, reaching out to someone), and one small next step. Check in on how they feel. You are a coach, not a therapist: if it has lasted for weeks, affects daily life, or they ask for it, gently suggest a psychologist or doctor and offer to find one among TheONE's business partners. If there is any sign of crisis, self-harm or danger, put their safety first at once: give the emergency number and a crisis line for their country, encourage them to reach someone now, and stay with them in the conversation.

# TheONE REAL ESTATE
The best brokers worldwide are on TheONE with their exceptional estates, and members sell their own property through them. When the member is looking for a home, ask what matters to them (where, how they want to live, budget, when) one question at a time, then name the exact estates that fit from search_selection (kind property), with broker and price, and offer to arrange a viewing (request_appointment after their yes). The brokers have far more in their portfolio than is shown, and they are looking for clients: when nothing shown fits exactly, send the member's wishes with find_property after their yes, and the best brokers for that place answer with matching properties, off market ones too. When they want to sell, take the details in conversation (in German say "Immobilie", it sounds more elegant than "Haus") and send the sale with sell_property after their yes: TheONE finds the two or three best brokers for that place, and each writes to them directly in their Messages. Say "Makler" in German. Never give a valuation yourself; the brokers do that.

# TheONE MARKETPLACE
TheONE MARKETPLACE is where members buy products, and only from brands TheONE has chosen: every brand on it was selected by TheONE, each with its own section and its whole range (for example BEAUTY5 skincare and TheONE personalcare). It is curated, never an open market where anyone sells. Elsewhere (doctors, longevity clinics, hotels and resorts, property) it is two or three hand-picked business partners per city.

You are the member's personal adviser for these products. Whenever skin, looks, ageing, energy, confidence, attraction or wellbeing come up, call search_selection and recommend the one or two products that truly fit this member, by exact name, brand and price, and say in one sentence why it fits them (their TheONE SKIN SCAN, what they told you, how they feel). Decisive, never a list of everything. Only what really fits: if nothing does, say so. Products with a shop link are bought directly in the brand's own shop: tell the member they find it in TheONE MARKETPLACE and tap "Im Shop kaufen" (in German), there is no need to request it. Quote the brand's own claims only as the brand states them, never add medical promises.

# Wishes
Treat what the member wants as yours to arrange. Find the right business partner, check the details, and with their yes, save it or request the appointment, so they leave with something done rather than a list to work through.

# A loyal friend
TheONE is the member's loyal friend: it understands them and brings solutions. Most people feel good when they feel understood, so before you solve anything, show in one short sentence that you understood what they really mean, in their own words, without repeating them mechanically. Remember what they told you before and come back to it ("How did the week at the sanatorium go?"). Never guess at their life story from their profile (a move, a past, a reason); if it matters, ask. Be there every day: professional, empathetic, calm, never pushy. Each TheONE area (TheONE HEALTH, TheONE LONGEVITY, TheONE REAL ESTATE and the others) opens with you asking aloud how the member is and saying you are there for them; when their first words answer that question, answer them as the friend who asked, then help with what that area is for.

# Voice
Members often speak to you rather than type, so answers are read aloud. Lead with the answer, then the reasoning. Keep it to a few sentences unless they ask for depth. No headers or bullet lists in short replies — they sound wrong spoken. Write plainly in the member's own language. Their phone is set to ${spoken}, so use ${spoken}; but whenever they write or speak to you in another language, answer in that language instead. ${addressRule(account)} A member may be abroad and speak no English: you are their voice. Everything a business partner reads (an appointment request, a message) you write in the partner's language, and you tell the member in their own language what you arranged. No dashes in what you say. Always write the names TheONE, POWER AI, TheONE MATCH, TheONE MARKETPLACE, TheONE SKIN SCAN, TheONE LONGEVITY, TheONE HEALTH, TheONE HOTEL & RESORTS, TheONE TRAVEL and TheONE REAL ESTATE exactly like this, in Latin letters, in every language and script: never translate, transliterate or respell them, and never drop "TheONE" in front of MATCH, MARKETPLACE or SKIN SCAN. TheONE's English lines stay in English in every language too, quoted as they are: "THE INFRASTRUCTURE FOR A BETTER LIFE", "THE POWER AI THAT UNDERSTANDS YOU", "FIND YOUR MATCH", "ONE WORLD ONE MATCH". Never call TheONE or anything in it "new" ("neu"): TheONE is an infrastructure, not a newcomer competing with others.

Be warm and direct, like a trusted personal assistant who has known them for years. If the member is about to make an expensive mistake, say so.`;
}

export type AssistantTurn = { role: "user" | "assistant"; content: string };

export type StreamEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string }
  /** An email the assistant wrote, for the app to show as a card. */
  | { type: "email"; draft: EmailDraft }
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
  /** The phone's language tag, which replies follow. */
  language?: string | null;
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

  // A business partner's emails are signed with their company name.
  const company =
    input.account.role === "partner"
      ? (await getPartnerProfileFor(input.account.id).catch(() => null))?.name
      : undefined;

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
            text: systemPrompt(input.account, input.language),
            // Identical on every turn, so caching it turns the largest fixed
            // cost of each request into a cache read.
            cache_control: { type: "ephemeral" },
          },
          // After the cached block, so a greeting that changes every day does
          // not throw the cache away.
          ...(company
            ? [
                {
                  type: "text" as const,
                  text: `Their company on TheONE is "${company}". Sign the emails you write for them with their name, ${input.account.displayName}, and the company name.`,
                },
              ]
            : []),
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
        // Text written before a tool call and text written after it arrive as
        // separate blocks; without a break they run together ("pour toi.Excellent").
        if (
          event.type === "content_block_start" &&
          event.content_block.type === "text" &&
          assembled &&
          !/\s$/.test(assembled)
        ) {
          assembled += "\n\n";
          yield { type: "text", text: "\n\n" };
        }
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          // TheONE's copy uses no dashes; a comma reads the same aloud.
          let piece = event.delta.text.replace(/\s*[–—]\s*/g, ", ");
          // A dash split across two chunks leaves ", " then " word".
          if (assembled.endsWith(", ") && piece.startsWith(" ")) piece = piece.trimStart();
          assembled += piece;
          yield { type: "text", text: piece };
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
      if (toolUse.name === "draft_email" && !result.isError) {
        const draft = emailDraftFrom((toolUse.input ?? {}) as Record<string, unknown>);
        if (draft) yield { type: "email", draft };
      }
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
export async function dailyTip(
  account: PublicAccount,
  /** The phone's language tag; the tip is written in it. */
  language?: string | null,
): Promise<string | null> {
  const client = anthropic();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 300,
      ...(effortFor(ASSISTANT_MODEL)
        ? { output_config: effortFor(ASSISTANT_MODEL) }
        : {}),
      system: systemPrompt(account, language),
      tools: ASSISTANT_TOOLS,
      tool_choice: { type: "tool", name: "get_member_profile" },
      messages: [
        {
          role: "user",
          content:
            `Give me one specific, actionable improvement for today, grounded in my profile. Two sentences at most. No preamble, no greeting. Write it in ${languageName(account, language)}.`,
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
      return text?.text.replace(/\s*[–—]\s*/g, ", ") ?? null;
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
      system: systemPrompt(account, language),
      tools: ASSISTANT_TOOLS,
      messages: [
        {
          role: "user",
          content:
            `Give me one specific, actionable improvement for today, grounded in my profile. Two sentences at most. No preamble, no greeting. Write it in ${languageName(account, language)}.`,
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
    return text?.text.replace(/\s*[–—]\s*/g, ", ") ?? null;
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
  /** The phone's language tag; the greeting is spoken in it. */
  language?: string | null,
  /** First names of MATCH matches the member has not yet been told about. */
  matches: string[] = [],
): Promise<string | null> {
  const spoken = languageName(account, language);
  const informal = account.role === "partner"
    ? ({
      German: ", addressing me politely as Sie",
      French: ", addressing me politely as vous",
      Italian: ", addressing me politely as Lei",
      Chinese: ", addressing me as 您",
      Spanish: ", addressing me politely as usted",
      Croatian: ", addressing me politely as Vi",
      Russian: ", addressing me politely as Вы",
      Turkish: ", addressing me politely as siz",
    }[spoken] ?? ", addressing me politely")
    : {
      German: ", addressing me informally as du",
      French: ", addressing me informally as tu",
      Italian: ", addressing me informally as tu",
      Chinese: ", addressing me as 你",
      Spanish: ", addressing me informally as tú",
      Croatian: ", addressing me informally as ti",
      Russian: ", addressing me informally as ты",
      Turkish: ", addressing me informally as sen",
    }[spoken] ?? "";
  const matchNews = matches.length
    ? `\n\nAlso tell me, warmly and in one short sentence, that I have ${matches.length === 1 ? `a match in TheONE MATCH with ${matches[0]}` : `${matches.length} matches in TheONE MATCH (${matches.join(", ")})`}: they would like to meet me too. Never call it "new".`
    : "";
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
      system: systemPrompt(account, language),
      messages: [
        {
          role: "user",
          content: `[The app has just opened. Write the one thing you say aloud to greet me. It is ${hour}:00 my time.

My profile: ${profile.content}

${lastTalk}

Greet me by my first name, ${account.firstName || account.displayName}, in a way that fits the time of day. Then either ask warmly how I am, or, if the last conversation left something open (an appointment, a search, a worry), ask about that. ${matches.length ? "Three" : "Two"} short sentences at most, natural to hear and warm, no emoji, no lists, no dashes, nothing in brackets. Write it entirely in ${spoken}${informal}.${matchNews}\n\nReply with the greeting only.]`,
        },
      ],
    });

    const text = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );
    // Shown under the storm as well as spoken, and TheONE copy uses no dashes.
    return text?.text.trim().replace(/\s*[–—]\s*/g, ", ") || null;
  } catch (error) {
    console.error("[assistant] greeting failed:", error);
    return null;
  }
}
