/**
 * Turns the raw facts of a visit (referrer, campaign tags, user agent) into
 * the few labels the dashboard groups by. Pure functions, no I/O, so the
 * tracking route and the application form attribute a visit identically.
 */

export const CHANNELS = [
  "direct",
  "search",
  "social",
  "email",
  "referral",
  "campaign",
] as const;
export type Channel = (typeof CHANNELS)[number];

export type Campaign = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
};

export type Attribution = Campaign & {
  channel: Channel;
  /** What the dashboard calls the source: "Google", "instagram", "newsletter". */
  source: string;
  referrerHost: string | null;
  landingPath: string | null;
};

const SEARCH = [
  /(^|\.)google\./,
  /(^|\.)bing\.com$/,
  /(^|\.)duckduckgo\.com$/,
  /(^|\.)search\.yahoo\.com$/,
  /(^|\.)ecosia\.org$/,
  /(^|\.)startpage\.com$/,
  /(^|\.)qwant\.com$/,
  /(^|\.)yandex\./,
  /(^|\.)baidu\.com$/,
  /(^|\.)search\.brave\.com$/,
  /(^|\.)perplexity\.ai$/,
  /(^|\.)chatgpt\.com$/,
];

/** host pattern → the name the dashboard shows. */
const SOCIAL: [RegExp, string][] = [
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)(facebook\.com|fb\.me|fb\.com)$/, "Facebook"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "LinkedIn"],
  [/(^|\.)(twitter\.com|x\.com|t\.co)$/, "X"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube"],
  [/(^|\.)pinterest\./, "Pinterest"],
  [/(^|\.)reddit\.com$/, "Reddit"],
  [/(^|\.)threads\.net$/, "Threads"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "WhatsApp"],
  [/(^|\.)(t\.me|telegram\.org)$/, "Telegram"],
  [/(^|\.)xing\.com$/, "XING"],
];

const EMAIL = [
  /(^|\.)mail\.google\.com$/,
  /(^|\.)outlook\.(live|office)\.com$/,
  /(^|\.)mail\.yahoo\.com$/,
  /(^|\.)gmx\./,
  /(^|\.)web\.de$/,
];

const SEARCH_NAMES: [RegExp, string][] = [
  [/google\./, "Google"],
  [/bing\.com$/, "Bing"],
  [/duckduckgo\.com$/, "DuckDuckGo"],
  [/yahoo\.com$/, "Yahoo"],
  [/ecosia\.org$/, "Ecosia"],
  [/perplexity\.ai$/, "Perplexity"],
  [/chatgpt\.com$/, "ChatGPT"],
];

function clean(value: string | null | undefined, max = 100): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase().replace(/^(www|m|l|lm)\./, "");
  } catch {
    return null;
  }
}

export function classify(input: {
  referrer: string | null;
  campaign: Campaign;
  ownHosts: string[];
  landingPath?: string | null;
}): Attribution {
  const campaign: Campaign = {
    utmSource: clean(input.campaign.utmSource)?.toLowerCase() ?? null,
    utmMedium: clean(input.campaign.utmMedium)?.toLowerCase() ?? null,
    utmCampaign: clean(input.campaign.utmCampaign),
    utmContent: clean(input.campaign.utmContent),
    utmTerm: clean(input.campaign.utmTerm),
  };

  let referrerHost = hostOf(input.referrer);
  // Moving between our own pages is not a source, and neither is coming back
  // from Stripe's checkout or billing pages, which are part of our own flow.
  if (
    referrerHost &&
    (input.ownHosts.some((own) => referrerHost === own || referrerHost?.endsWith(`.${own}`)) ||
      /(^|\.)stripe\.com$/.test(referrerHost))
  ) {
    referrerHost = null;
  }

  const base = { ...campaign, referrerHost, landingPath: input.landingPath ?? null };

  // A tagged link says what it is; that beats guessing from the referrer.
  if (campaign.utmSource || campaign.utmCampaign) {
    return {
      ...base,
      channel: campaign.utmMedium === "email" || campaign.utmMedium === "newsletter" ? "email" : "campaign",
      source: campaign.utmSource ?? referrerHost ?? "unknown",
    };
  }

  if (!referrerHost) return { ...base, channel: "direct", source: "Direct" };

  if (SEARCH.some((pattern) => pattern.test(referrerHost))) {
    const name = SEARCH_NAMES.find(([pattern]) => pattern.test(referrerHost!))?.[1];
    return { ...base, channel: "search", source: name ?? referrerHost };
  }

  const social = SOCIAL.find(([pattern]) => pattern.test(referrerHost!));
  if (social) return { ...base, channel: "social", source: social[1] };

  if (EMAIL.some((pattern) => pattern.test(referrerHost!))) {
    return { ...base, channel: "email", source: referrerHost };
  }

  return { ...base, channel: "referral", source: referrerHost };
}

export type Device = "mobile" | "tablet" | "desktop";

export function deviceOf(userAgent: string): Device {
  if (/iPad|Tablet|Nexus (7|9|10)|SM-T|Kindle|Silk/i.test(userAgent)) return "tablet";
  if (/Android(?!.*Mobile)/i.test(userAgent)) return "tablet";
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(userAgent)) return "mobile";
  return "desktop";
}

/** Crawlers, link previews and automated browsers are not visitors. */
export function isBot(userAgent: string): boolean {
  if (!userAgent) return true;
  return /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit|embedly|quora link|vkshare|w3c_validator|python-requests|curl|wget|node-fetch|axios|playwright|puppeteer|phantomjs/i.test(
    userAgent,
  );
}
