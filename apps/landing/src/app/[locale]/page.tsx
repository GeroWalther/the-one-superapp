import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { HeroSection } from "@/components/HeroSection";
import { PillarsSection } from "@/components/PillarsSection";
import { LockedPreviewSection } from "@/components/LockedPreviewSection";
import { PhilosophySection } from "@/components/PhilosophySection";
import { Footer } from "@/components/Footer";
import { getCurrentMember } from "@/lib/dal";

/**
 * The public teaser. Members never land here — the proxy redirects them, and
 * this second check covers the case where the cookie is valid but the account
 * behind it has changed.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const member = await getCurrentMember();

  if (member) {
    redirect(`/${locale}/members`);
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <PillarsSection />
        <LockedPreviewSection />
        <PhilosophySection />
      </main>
      <Footer />
    </>
  );
}
