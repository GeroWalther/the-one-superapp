import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Star } from "lucide-react";
import { SERVICES } from "@/lib/services";

/**
 * The unlocked verticals grid. `highlight` receives the focus areas a member
 * chose during enrolment, which get a gold edge and a badge.
 */
export function ServicesSection({ highlight = [] }: { highlight?: string[] }) {
  const t = useTranslations("members");
  const tServices = useTranslations("services");

  return (
    <section id="services" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-4 font-display text-[30px] font-light leading-tight text-mist sm:text-[38px]">
            {t("exploreTitle")}
          </h2>
          <p className="mt-4 text-[14.5px] leading-[1.75] text-mist-dim">
            {t("exploreSubtitle")}
          </p>
        </div>

        <div
          data-reveal
          data-reveal-delay="120"
          className="mt-12 grid grid-cols-2 gap-2.5 sm:grid-cols-4"
        >
          {SERVICES.map((service) => {
            const isFocus = highlight.includes(service.focusKey);

            return (
              <div
                key={service.messageKey}
                className={`group relative overflow-hidden rounded-[16px] ring-1 transition-all duration-500 hover:ring-gold-300/45 ${
                  isFocus ? "ring-gold-300/55" : "ring-white/8"
                } ${service.span ?? ""}`}
                style={{
                  aspectRatio: service.span?.includes("row-span-2")
                    ? undefined
                    : "4/3",
                }}
              >
                <Image
                  src={service.image}
                  alt={tServices(service.messageKey)}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.06]"
                />
                <div
                  className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-90"
                  style={{
                    background: `linear-gradient(160deg, ${service.tint}d9 0%, ${service.tint}59 52%, rgba(4,7,10,0.55) 100%)`,
                  }}
                />

                {isFocus && (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-gold-300/40 bg-ink-900/70 px-2.5 py-1 backdrop-blur-sm">
                    <Star
                      className="h-2.5 w-2.5 fill-gold-300 text-gold-300"
                      strokeWidth={1.5}
                    />
                    <span className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-gold-200">
                      {t("yourFocus")}
                    </span>
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5 sm:p-4">
                  <p
                    className={
                      service.span?.includes("row-span-2")
                        ? "font-display text-[19px] font-medium tracking-wide text-white drop-shadow sm:text-[22px]"
                        : "text-[12px] font-semibold tracking-wide text-white drop-shadow sm:text-[13px]"
                    }
                  >
                    {tServices(service.messageKey)}
                  </p>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 translate-y-1 text-white/70 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                    strokeWidth={1.6}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
