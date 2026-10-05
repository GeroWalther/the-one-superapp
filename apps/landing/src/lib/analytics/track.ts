import "server-only";
import { createHash } from "node:crypto";
import { ObjectId } from "mongodb";
import { pageViews } from "../db/collections";
import { siteUrl } from "../urls";
import { classify, deviceOf, hostOf, type Attribution, type Campaign } from "./classify";

/**
 * Server side of the cookieless analytics. Nothing here stores an IP address
 * or sets anything on the visitor's device.
 */

const TIME_ZONE = "Europe/Vienna";

export function dayOf(date: Date): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

/** Our own hosts, so moving between our pages never counts as a referral. */
export function ownHosts(): string[] {
  return [
    hostOf(siteUrl("/")),
    "theone-superapp.com",
    "theone-superapp.vercel.app",
    "localhost",
  ].filter((host): host is string => Boolean(host));
}

/**
 * Same visitor on the same day → same id; the next day → a different one.
 * Salted, because a bare hash of an IP is reversible by brute force.
 */
export function visitorId(ip: string, userAgent: string, day: string): string {
  const salt = process.env.HASH_SECRET ?? process.env.SESSION_SECRET ?? "";
  return createHash("sha256")
    .update(`${salt}:visitor:${day}:${ip}:${userAgent}`)
    .digest("hex")
    .slice(0, 20);
}

/** Vercel resolves the visitor's location at its edge; we only read the result. */
export function geoOf(headers: Headers): { country: string | null; city: string | null } {
  const country = headers.get("x-vercel-ip-country");
  const city = headers.get("x-vercel-ip-city");
  let decodedCity: string | null = null;
  if (city) {
    try {
      decodedCity = decodeURIComponent(city);
    } catch {
      decodedCity = city;
    }
  }
  return {
    country: country && /^[A-Z]{2}$/.test(country) ? country : null,
    city: decodedCity?.slice(0, 80) || null,
  };
}

export function ipOf(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function recordPageView(input: {
  path: string;
  locale: string;
  entry: boolean;
  referrer: string | null;
  campaign: Campaign;
  headers: Headers;
}): Promise<void> {
  const now = new Date();
  const day = dayOf(now);
  const userAgent = input.headers.get("user-agent") ?? "";
  const attribution = classify({
    referrer: input.referrer,
    campaign: input.campaign,
    ownHosts: ownHosts(),
  });
  const geo = geoOf(input.headers);

  await (await pageViews()).insertOne({
    _id: new ObjectId(),
    at: now,
    day,
    path: input.path,
    locale: input.locale,
    visitorId: visitorId(ipOf(input.headers), userAgent, day),
    entry: input.entry,
    channel: attribution.channel,
    source: attribution.source,
    referrerHost: attribution.referrerHost,
    utmSource: attribution.utmSource,
    utmMedium: attribution.utmMedium,
    utmCampaign: attribution.utmCampaign,
    utmContent: attribution.utmContent,
    country: geo.country,
    city: geo.city,
    device: deviceOf(userAgent),
  });
}

/**
 * Attribution for an application, from what the form carried over from the
 * visit's first page. Re-classified here rather than trusted as sent: the
 * hidden field is user-editable, so only the raw facts are taken from it.
 */
export function attributionFromForm(
  raw: FormDataEntryValue | null,
  headers: Headers,
): (Attribution & { country: string | null; city: string | null }) | null {
  let data: Record<string, unknown> = {};
  if (typeof raw === "string" && raw.length < 2000) {
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      data = {};
    }
  }
  const text = (key: string) => (typeof data[key] === "string" ? (data[key] as string) : null);

  const attribution = classify({
    referrer: text("referrer"),
    campaign: {
      utmSource: text("utmSource"),
      utmMedium: text("utmMedium"),
      utmCampaign: text("utmCampaign"),
      utmContent: text("utmContent"),
      utmTerm: text("utmTerm"),
    },
    ownHosts: ownHosts(),
    landingPath: text("landingPath")?.slice(0, 200) ?? null,
  });

  return { ...attribution, ...geoOf(headers) };
}
