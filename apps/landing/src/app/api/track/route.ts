import * as z from "zod";
import { cookies } from "next/headers";
import { isBot } from "@/lib/analytics/classify";
import { ipOf, recordPageView } from "@/lib/analytics/track";
import { SESSION_COOKIE, decrypt } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";

const PageView = z.object({
  path: z.string().startsWith("/").max(300),
  locale: z.enum(["de", "en"]),
  entry: z.boolean(),
  referrer: z.string().max(500).nullable(),
  utmSource: z.string().max(100).nullable(),
  utmMedium: z.string().max(100).nullable(),
  utmCampaign: z.string().max(100).nullable(),
  utmContent: z.string().max(100).nullable(),
  utmTerm: z.string().max(100).nullable(),
});

const done = () => new Response(null, { status: 204 });

/**
 * Page-view beacon from the public site. Always answers 204: the browser
 * fires and forgets, and a tracking failure must never surface to a visitor.
 */
export async function POST(request: Request) {
  try {
    if (isBot(request.headers.get("user-agent") ?? "")) return done();

    // The team's own browsing would otherwise be a large share of early traffic.
    const session = await decrypt((await cookies()).get(SESSION_COOKIE)?.value);
    if (session?.role === "admin") return done();

    const parsed = PageView.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return done();

    const limited = await checkRateLimit(`track:${ipOf(request.headers)}`, {
      limit: 600,
      windowSeconds: 60 * 60,
    });
    if (!limited.ok) return done();

    const view = parsed.data;
    await recordPageView({
      path: view.path,
      locale: view.locale,
      entry: view.entry,
      referrer: view.referrer,
      campaign: {
        utmSource: view.utmSource,
        utmMedium: view.utmMedium,
        utmCampaign: view.utmCampaign,
        utmContent: view.utmContent,
        utmTerm: view.utmTerm,
      },
      headers: request.headers,
    });
  } catch (error) {
    console.error("[analytics] page view not recorded:", error);
  }
  return done();
}
