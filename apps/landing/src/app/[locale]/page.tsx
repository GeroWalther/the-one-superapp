import { SiteHeader } from "@/components/SiteHeader";
import { HeroSection } from "@/components/HeroSection";
import { PillarsSection } from "@/components/PillarsSection";
import { AudienceSection } from "@/components/AudienceSection";
import { ServicesSection } from "@/components/ServicesSection";
import { ProcessSection } from "@/components/ProcessSection";
import { PhilosophySection } from "@/components/PhilosophySection";
import { ApplySection } from "@/components/ApplySection";
import { Footer } from "@/components/Footer";

/**
 * The public marketing site.
 *
 * Ordered as a single argument, each section answering the question the last
 * one raises: what is it, what does it do, what do I get, what is actually
 * inside, how do I get in, apply. Everything is deliberately visible — the
 * product is sold on what is inside it, and access is controlled by the
 * application process rather than by hiding the offering.
 */
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* What it is */}
        <HeroSection />

        {/* What it does — the three layers */}
        <PillarsSection />

        {/* What you get, per audience, with the price. The page's spine. */}
        <AudienceSection />

        {/* What is actually inside */}
        <ServicesSection />

        {/* How access works: apply, review, credentials, payment */}
        <ProcessSection />

        {/* The refusals — read as terms once someone is already interested */}
        <PhilosophySection />

        {/* Apply */}
        <ApplySection />
      </main>
      <Footer />
    </>
  );
}
