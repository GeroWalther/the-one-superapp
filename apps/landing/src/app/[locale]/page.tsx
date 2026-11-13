import { SiteHeader } from "@/components/SiteHeader";
import { PreviewLanding } from "@/components/preview/PreviewLanding";
import { PositioningSection } from "@/components/PositioningSection";
import { ApplySection } from "@/components/ApplySection";
import { GiveawaySection } from "@/components/GiveawaySection";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

/* Canonical and language versions only for the home page, so subpages do not
   inherit a canonical pointing here. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: {
      canonical: `/${locale}`,
      languages: { de: "/de", en: "/en", "x-default": "/en" },
    },
  };
}

/**
 * The public marketing site. Everything here is deliberately visible: the
 * product is sold on what is inside it, and access is controlled by the
 * application process rather than by hiding the offering.
 */
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PreviewLanding />
        <PositioningSection />
        <ApplySection />
        <GiveawaySection />
      </main>
      <Footer />
    </>
  );
}
