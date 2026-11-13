import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type SeoPage = "about" | "enroll" | "member" | "partner" | "imprint" | "privacy" | "giveaway";

/**
 * Description, canonical and language versions for a public subpage.
 * `path` is the route after the locale, e.g. "/about".
 */
export async function pageSeo(locale: string, page: SeoPage, path: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "seo.pages" });
  return {
    description: t(page),
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { de: `/de${path}`, en: `/en${path}`, "x-default": path || "/" },
    },
  };
}

/** Login, account and similar pages: reachable, but kept out of search. */
export const NO_INDEX: Metadata = { robots: { index: false, follow: false } };
