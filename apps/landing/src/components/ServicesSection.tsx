import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Star } from "lucide-react";
import { SERVICES } from "@/lib/services";

/**
 * The unlocked verticals grid. `highlight` receives the focus areas a member
 * chose during enrolment, which get a gold edge and a badge.
 */
export function ServicesSection({ highlight = [] }: { highlight?: string[] }) {
  const t = useTranslations("verticals");
  const tServices = useTranslations("services");

  return (
    <section id="verticals" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-4 font-display text-[30px] font-light leading-tight text-ink sm:text-[38px]">
            {t("exploreTitle")}
          </h2>
          <p className="mt-4 text-[14.5px] leading-[1.75] text-ink-soft">
            {t("exploreSubtitle")}
          </p>
        </div>

        {/* Caption sits below the image rather than over it: on a paper page an
            overlay needs a dark scrim to stay legible, and eight dark scrims
            would drag the whole section back toward the old theme. */}
        <div
          data-reveal
          data-reveal-delay="120"
          className="mt-12 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4"
        >
          {SERVICES.map((service) => {
            const isFocus = highlight.includes(service.focusKey);

            return (
              <figure key={service.messageKey} className="group">
                <div
                  className={`relative aspect-4/5 overflow-hidden rounded-[18px] ring-1 transition-all duration-500 group-hover:ring-aqua-400 ${
                    isFocus ? "ring-aqua-400" : "ring-line"
                  }`}
                >
                  <Image
                    src={service.image}
                    alt={tServices(service.messageKey)}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.05]"
                  />
                  {/* A whisper of the vertical's tint, so the row still reads as
                      a set without burying the photograph. */}
                  <div
                    className="absolute inset-0 opacity-25 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-10"
                    style={{
                      background: `linear-gradient(165deg, transparent 35%, ${service.tint} 100%)`,
                    }}
                  />

                  {isFocus && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-paper/90 px-2.5 py-1 shadow-sm backdrop-blur-sm">
                      <Star
                        className="h-2.5 w-2.5 fill-aqua-500 text-aqua-500"
                        strokeWidth={1.5}
                      />
                      <span className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-aqua-700">
                        {t("yourFocus")}
                      </span>
                    </span>
                  )}
                </div>

                <figcaption className="mt-3.5 flex items-start justify-between gap-2">
                  <p className="text-[13.5px] font-medium leading-snug text-ink">
                    {tServices(service.messageKey)}
                  </p>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 translate-y-1 text-aqua-500 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                    strokeWidth={1.6}
                  />
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
