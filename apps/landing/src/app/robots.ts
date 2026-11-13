import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/de/admin", "/en/admin", "/de/account", "/en/account"],
    },
    sitemap: "https://www.theone-superapp.com/sitemap.xml",
  };
}
