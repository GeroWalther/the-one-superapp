import { apiError, authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { isVoiceConfigured, synthesize } from "@/lib/voice/elevenlabs";

/**
 * POWER AI's words in POWER AI's voice: MP3 audio for the app to play.
 * 503 when the cloud voice is unavailable; the app then uses the phone's.
 */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  if (!isVoiceConfigured()) return apiError("voice_unavailable", 503);

  const limit = await checkRateLimit(`api:voice:${auth.account.id}`, { limit: 150, windowSeconds: 60 * 60 });
  if (!limit.ok) return apiError("rate_limited", 429);

  let body: { text?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_json", 400);
  }
  if (typeof body.text !== "string" || !body.text.trim()) return apiError("missing_text", 400);

  const audio = await synthesize(body.text);
  if (!audio) return apiError("voice_unavailable", 503);

  return new Response(audio, {
    headers: { "content-type": "audio/mpeg", "cache-control": "private, max-age=86400" },
  });
}
