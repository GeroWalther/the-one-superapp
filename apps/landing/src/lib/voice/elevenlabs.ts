import "server-only";
import { createHash } from "node:crypto";

/**
 * POWER AI's own voice, from ElevenLabs: the owner's voice, cloned with
 * consent (ELEVENLABS_VOICE_ID). The app sends what POWER AI says and plays
 * the audio; when this is not configured or fails, the app speaks with the
 * iPhone's own voice instead, so POWER AI is never silent.
 */

const API = "https://api.elevenlabs.io/v1/text-to-speech";
const MAX_CHARS = 2500;

export function isVoiceConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID);
}

/** What the voice should say: no markdown, names said the way they sound. */
export function spokenText(text: string): string {
  return text
    .replace(/\*\*|__|`/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/^\s*[-•]\s+/gm, "")
    // Said as words, not letters: "The One", "Power A.I.".
    .replace(/TheONE/g, "The One")
    .replace(/POWER AI/g, "Power A.I.")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CHARS);
}

// The same words (an area's opener, a greeting) are said again and again:
// kept for a while, they cost nothing the second time and play at once.
const cache = new Map<string, ArrayBuffer>();
const CACHE_SIZE = 150;

export async function synthesize(text: string): Promise<ArrayBuffer | null> {
  if (!isVoiceConfigured()) return null;
  const words = spokenText(text);
  if (!words) return null;

  const voice = process.env.ELEVENLABS_VOICE_ID!;
  const model = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
  // The owner chose version "B": the original recording, set calmer, so
  // breath and microphone pops are copied less (2026-11-18).
  const settings = { stability: 0.65, similarity_boost: 0.7, style: 0, use_speaker_boost: true };
  const key = createHash("sha256")
    .update(`${voice}:${model}:${JSON.stringify(settings)}:${words}`)
    .digest("hex");
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }

  try {
    const response = await fetch(`${API}/${voice}?output_format=mp3_44100_64`, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: words,
        model_id: model,
        voice_settings: settings,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      console.error("[voice] ElevenLabs answered", response.status, (await response.text()).slice(0, 200));
      return null;
    }
    const audio = await response.arrayBuffer();
    cache.set(key, audio);
    if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!);
    return audio;
  } catch (error) {
    console.error("[voice] ElevenLabs failed:", error);
    return null;
  }
}
