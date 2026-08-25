import { SiteHeader } from "@/components/SiteHeader";
import { PreviewLanding } from "@/components/preview/PreviewLanding";
import { PreviewDivider } from "@/components/preview/PreviewDivider";
import { HeroSection } from "@/components/HeroSection";
import { PositioningSection } from "@/components/PositioningSection";
import { PillarsSection } from "@/components/PillarsSection";
import { ServicesSection } from "@/components/ServicesSection";
import { ProcessSection } from "@/components/ProcessSection";
import { BenefitsSection } from "@/components/BenefitsSection";
import { PhilosophySection } from "@/components/PhilosophySection";
import { ApplySection } from "@/components/ApplySection";
import { Footer } from "@/components/Footer";

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
        <HeroSection />
        <PositioningSection />
        <PillarsSection />
        <ServicesSection />
        <ProcessSection />
        <BenefitsSection />
        <PhilosophySection />
        <ApplySection />

        {/* Design comparison, kept below the live page. Deleting these four
            lines removes it entirely. */}
        <PreviewDivider label="start" />
        <PreviewLanding />
        <PreviewDivider label="end" />
      </main>
      <Footer />
    </>
  );
}
