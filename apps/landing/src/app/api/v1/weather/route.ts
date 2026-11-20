import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { languageTag, outfitAdvice } from "@/lib/ai/assistant";
import { describe, forecast } from "@/lib/weather/service";
import { checkRateLimit } from "@/lib/rate-limit";

/** What to wear is asked once per place, day and language, not on every open. */
const advice = new Map<string, { text: string | null; at: number }>();

/**
 * GET /api/v1/weather?lat=…&lon=…&tz=Europe/Madrid&place=Palma&language=de
 * The forecast for the place the app chose (the member's location, or their
 * city), the next seven days, and POWER AI's word on what to wear today.
 */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const limit = await checkRateLimit(`api:weather:${auth.account.id}`, { limit: 120, windowSeconds: 3600 });
  if (!limit.ok) return apiError("too_many", 429);

  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return apiError("invalid_location", 400);
  }
  let tz = params.get("tz") || "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
  } catch {
    tz = "UTC";
  }
  const place = (params.get("place") || "").slice(0, 80);
  const language = languageTag(params.get("language"));

  const weather = await forecast(lat, lon, tz);
  if (!weather) return apiError("unavailable", 503);

  const key = `${lat.toFixed(1)},${lon.toFixed(1)}|${weather.today.date}|${language ?? ""}|${auth.account.role}`;
  let outfit = advice.get(key);
  if (!outfit || Date.now() - outfit.at > 3 * 3600 * 1000) {
    const text = await outfitAdvice(auth.account, language, {
      min: weather.today.min,
      max: weather.today.max,
      now: weather.now.temperature,
      condition: describe(weather.today.symbol),
      rainMm: weather.today.rainMm,
      windMs: weather.today.windMs,
      place: place || "the member's city",
    });
    outfit = { text, at: Date.now() };
    advice.set(key, outfit);
    if (advice.size > 5000) advice.delete(advice.keys().next().value!);
  }

  return NextResponse.json({ ...weather, outfit: outfit.text, source: "MET Norway" });
}
