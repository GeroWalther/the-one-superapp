import "server-only";

/**
 * The forecast for a place, from MET Norway's Locationforecast (free, also for
 * commercial use, under CC BY 4.0: the app credits MET Norway). MET asks for an
 * identifying User-Agent, coordinates with at most four decimals and caching,
 * so forecasts are kept for half an hour per place.
 */

const USER_AGENT = "TheONE/1.0 https://www.theone-superapp.com";

export type WeatherDay = {
  date: string;
  min: number;
  max: number;
  symbol: string;
  rainMm: number;
};

export type Weather = {
  now: { temperature: number; symbol: string; windMs: number };
  today: WeatherDay & { windMs: number };
  days: WeatherDay[];
};

type Series = {
  time: string;
  data: {
    instant: { details: { air_temperature: number; wind_speed?: number } };
    next_1_hours?: { summary: { symbol_code: string }; details?: { precipitation_amount?: number } };
    next_6_hours?: { summary: { symbol_code: string }; details?: { precipitation_amount?: number } };
  };
};

const cache = new Map<string, { at: number; series: Series[] }>();
const TTL = 30 * 60 * 1000;

async function series(lat: number, lon: number): Promise<Series[] | null> {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.series;
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}`;
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!response?.ok) return hit?.series ?? null;
  const body = (await response.json()) as { properties?: { timeseries?: Series[] } };
  const list = body.properties?.timeseries ?? [];
  cache.set(key, { at: Date.now(), series: list });
  if (cache.size > 2000) cache.delete(cache.keys().next().value!);
  return list;
}

/** "partlycloudy_day" → "partlycloudy": the app picks day or night itself. */
const base = (code: string) => code.replace(/_(day|night|polartwilight)$/, "");

export async function forecast(lat: number, lon: number, timeZone: string): Promise<Weather | null> {
  const list = await series(lat, lon);
  if (!list?.length) return null;

  const dayOf = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
  const hourOf = (iso: string) =>
    Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(new Date(iso)));

  const byDay = new Map<string, Series[]>();
  for (const entry of list) {
    const day = dayOf(entry.time);
    byDay.set(day, [...(byDay.get(day) ?? []), entry]);
  }

  const days: (WeatherDay & { windMs: number })[] = [];
  for (const [date, entries] of byDay) {
    const temps = entries.map((e) => e.data.instant.details.air_temperature);
    // The day's picture: the forecast nearest midday.
    const midday = [...entries].sort((a, b) => Math.abs(hourOf(a.time) - 12) - Math.abs(hourOf(b.time) - 12))[0];
    const symbol =
      midday.data.next_6_hours?.summary.symbol_code ?? midday.data.next_1_hours?.summary.symbol_code ?? "cloudy";
    const rainMm = entries.reduce((sum, e) => sum + (e.data.next_1_hours?.details?.precipitation_amount ?? 0), 0);
    days.push({
      date,
      min: Math.min(...temps),
      max: Math.max(...temps),
      symbol: base(symbol),
      rainMm: Math.round(rainMm * 10) / 10,
      windMs: Math.max(...entries.map((e) => e.data.instant.details.wind_speed ?? 0)),
    });
  }

  const first = list[0];
  // "Today" for what to wear is the next twelve hours, so a forecast opened
  // late in the evening still speaks about the hours ahead.
  const ahead = list.filter((e) => new Date(e.time).getTime() - new Date(first.time).getTime() < 12 * 3600 * 1000);
  const aheadTemps = ahead.map((e) => e.data.instant.details.air_temperature);
  const today = {
    ...days[0],
    min: Math.min(...aheadTemps),
    max: Math.max(...aheadTemps),
    rainMm: Math.round(ahead.reduce((s, e) => s + (e.data.next_1_hours?.details?.precipitation_amount ?? 0), 0) * 10) / 10,
    windMs: Math.max(...ahead.map((e) => e.data.instant.details.wind_speed ?? 0)),
  };
  return {
    now: {
      temperature: first.data.instant.details.air_temperature,
      symbol: base(first.data.next_1_hours?.summary.symbol_code ?? first.data.next_6_hours?.summary.symbol_code ?? today.symbol),
      windMs: first.data.instant.details.wind_speed ?? 0,
    },
    today,
    days: days.slice(0, 7).map(({ windMs: _wind, ...day }) => day),
  };
}

/** A plain description of a symbol, for the outfit advice. */
export function describe(symbol: string): string {
  if (symbol.includes("thunder")) return "thunderstorms";
  if (symbol.includes("snow")) return "snow";
  if (symbol.includes("sleet")) return "sleet";
  if (symbol.includes("rainshowers")) return "rain showers";
  if (symbol.includes("rain")) return "rain";
  if (symbol === "fog") return "fog";
  if (symbol === "cloudy") return "overcast";
  if (symbol === "partlycloudy") return "partly cloudy";
  if (symbol === "fair") return "mostly sunny";
  return "sunny";
}
