import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { routing } from "@/i18n/routing";
import { ScrollReveal } from "@/components/ScrollReveal";
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

export const metadata: Metadata = {
  title: "TheONE — The Premium Super App",
  description:
    "A private decision infrastructure for health, longevity, wealth and lifestyle. Access by application only.",
};

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
      style={{ colorScheme: "dark" }}
    >
      <head>
        {/* Without JS the reveal observer never runs, which would leave every
            `[data-reveal]` section stuck at opacity 0. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-full flex flex-col bg-ink-900 font-sans text-mist">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <ScrollReveal />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
