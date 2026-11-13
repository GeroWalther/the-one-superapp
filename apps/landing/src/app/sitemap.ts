import type { MetadataRoute } from "next";

const SITE_URL = "https://www.theone-superapp.com";
const PAGES = ["", "/about", "/enroll", "/imprint", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((path) =>
    (["de", "en"] as const).map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.6,
      alternates: {
        languages: { de: `${SITE_URL}/de${path}`, en: `${SITE_URL}/en${path}` },
      },
    })),
  );
}
