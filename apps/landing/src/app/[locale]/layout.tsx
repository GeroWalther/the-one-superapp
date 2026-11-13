import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { routing } from "@/i18n/routing";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Analytics } from "@/components/Analytics";
import "../globals.css";

/* Display face — used for headlines and the wordmark. */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700"],
});

/* UI face — everything else. Serif body copy at 13px was hurting legibility. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const SITE_URL = "https://www.theone-superapp.com";

/* Site-wide defaults per language. Pages that set their own title keep it;
   the description and the social preview fall back to these. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    metadataBase: new URL(SITE_URL),
    title: t("title"),
    description: t("description"),
    openGraph: {
      type: "website",
      siteName: "TheONE SUPER APP",
      locale: locale === "de" ? "de_DE" : "en_GB",
      title: t("title"),
      description: t("description"),
      images: [{ url: "/images/og-theone.png", width: 1200, height: 630, alt: t("ogAlt") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/images/og-theone.png"],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <html
      lang={locale}
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <head>
        {/* Without JS the reveal observer never runs, which would leave every
            `[data-reveal]` section stuck at opacity 0. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-full flex flex-col bg-paper font-sans text-ink">
        {/* Who the site belongs to, for Google's knowledge panel and logo. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#organization`,
                  name: "TheONE SUPER APP",
                  url: SITE_URL,
                  logo: `${SITE_URL}/images/theone-lockup-v4.png`,
                },
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  name: "TheONE SUPER APP",
                  url: `${SITE_URL}/${locale}`,
                  inLanguage: locale,
                  description: (messages as { seo: { description: string } }).seo.description,
                  publisher: { "@id": `${SITE_URL}/#organization` },
                },
              ],
            }),
          }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <ScrollReveal />
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
