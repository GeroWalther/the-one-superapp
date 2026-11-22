import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { messages, type MessageDoc } from "../db/collections";

/**
 * TheONE's live interpreter: every message in a conversation between a member
 * and a business partner is shown to each reader in their own language. A
 * Japanese member writes Japanese, the clinic in Munich reads German, and the
 * answer comes back in Japanese.
 *
 * Each message is translated once per language and kept on the message, so a
 * conversation reads instantly the second time and costs nothing more.
 */

const MODEL = process.env.TRANSLATE_MODEL ?? process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
/** How many messages one look at a conversation may translate. */
const BATCH = 25;

let client: Anthropic | null | undefined;
function anthropic(): Anthropic | null {
  if (client !== undefined) return client;
  client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
  return client;
}

/** "ja-JP" → "ja"; "zh-Hans-CN" → "zh". */
export function baseLanguage(tag: string | null | undefined): string | null {
  if (typeof tag !== "string" || !tag.trim() || tag.length > 35) return null;
  try {
    const canonical = Intl.getCanonicalLocales(tag.trim())[0];
    return canonical ? canonical.split("-")[0].toLowerCase() : null;
  } catch {
    return null;
  }
}

function languageName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["messages"],
  properties: {
    messages: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "sourceLanguage", "translation"],
        properties: {
          id: { type: "string" },
          sourceLanguage: { type: "string", description: "ISO 639-1 code of the language the text is written in." },
          translation: { type: "string" },
        },
      },
    },
  },
} as const;

/**
 * Fills in `translations[target]` (and `language`) on the given messages that
 * lack it, in one call, and stores the result. Messages already in the target
 * language get their own text. Never throws: without a translation the
 * original simply stands.
 */
export async function ensureTranslations(docs: MessageDoc[], target: string): Promise<void> {
  const api = anthropic();
  if (!api) return;
  const missing = docs.filter((d) => d.translations?.[target] === undefined && d.language !== target).slice(-BATCH);
  if (missing.length === 0) return;

  const system = `You are TheONE's live interpreter between members and business partners (clinics, hotels, brands). Translate each message into ${languageName(target)} (${target}). Keep the meaning, tone and politeness exactly; keep names, product names, brand names, prices, dates, times and phone numbers as they are; write TheONE and POWER AI exactly like that. Never add, explain or leave out anything. Never use dashes; use a comma or a colon. If a message is already in ${languageName(target)}, return it unchanged. sourceLanguage is the ISO 639-1 code of the language each message is written in.`;

  let parsed: { messages: { id: string; sourceLanguage: string; translation: string }[] };
  try {
    const response = await api.messages.create({
      model: MODEL,
      max_tokens: 8000,
      output_config: { format: { type: "json_schema", schema: SCHEMA as unknown as Record<string, unknown> } },
      system,
      messages: [
        {
          role: "user",
          content: JSON.stringify(missing.map((d) => ({ id: d._id.toHexString(), text: d.body }))),
        },
      ],
    });
    const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? "";
    parsed = JSON.parse(text);
  } catch (error) {
    console.error("[translate] failed:", error);
    return;
  }

  const byId = new Map(missing.map((d) => [d._id.toHexString(), d]));
  const collection = await messages();
  await Promise.all(
    parsed.messages.map(async (out) => {
      const doc = byId.get(out.id);
      const translation = out.translation?.trim();
      if (!doc || !translation) return;
      const language = baseLanguage(out.sourceLanguage) ?? undefined;
      doc.translations = { ...(doc.translations ?? {}), [target]: translation };
      if (language) doc.language = language;
      await collection.updateOne(
        { _id: doc._id },
        { $set: { [`translations.${target}`]: translation, ...(language ? { language } : {}) } },
      );
    }),
  );
}
