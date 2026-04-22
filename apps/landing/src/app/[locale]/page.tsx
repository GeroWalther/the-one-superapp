import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { BenefitsSection } from "@/components/BenefitsSection";
import { GalleryCtaSection } from "@/components/GalleryCtaSection";
import { Mockup2Section } from "@/components/Mockup2Section";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <BenefitsSection />
        <GalleryCtaSection />
        <Mockup2Section />
      </main>
      <Footer />
    </>
  );
}
