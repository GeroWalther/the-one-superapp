import { SiteHeader } from "@/components/SiteHeader";
import { PreviewLanding } from "@/components/preview/PreviewLanding";
import { PositioningSection } from "@/components/PositioningSection";
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
        <PreviewLanding />
        <PositioningSection />
        <ApplySection />
      </main>
      <Footer />
    </>
  );
}
