import { Gift } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

/** Shared chrome for every step of the enrolment journey. */
export function EnrollShell({
  eyebrow,
  title,
  subtitle,
  inviteBanner,
  width = "xl",
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  inviteBanner?: string;
  width?: "xl" | "2xl";
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="grain relative flex-1 overflow-hidden pb-24 pt-[122px] sm:pt-[140px]">
        <div className="aurora aurora--deep opacity-80">
          <span className="aurora-bloom" />
        </div>

        <div
          className={`relative mx-auto px-6 lg:px-8 ${
            width === "2xl" ? "max-w-2xl" : "max-w-xl"
          }`}
        >
          <div data-reveal className="text-center">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-4 font-display text-[36px] font-light leading-tight text-mist sm:text-[44px]">
              {title}
            </h1>
            {subtitle && (
              <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-[1.75] text-mist-dim">
                {subtitle}
              </p>
            )}
          </div>

          {inviteBanner && (
            <div
              data-reveal
              data-reveal-delay="80"
              className="mx-auto mt-8 flex max-w-md items-center gap-3 rounded-2xl border border-gold-300/30 bg-gold-300/10 px-5 py-4"
            >
              <Gift className="h-5 w-5 shrink-0 text-gold-300" strokeWidth={1.5} />
              <p className="text-[13px] leading-[1.6] text-gold-200">
                {inviteBanner}
              </p>
            </div>
          )}

          <div data-reveal data-reveal-delay="120" className="mt-10">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
