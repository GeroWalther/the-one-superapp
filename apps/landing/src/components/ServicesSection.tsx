import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Star } from "lucide-react";
import { SERVICES } from "@/lib/services";

/**
 * The seven verticals — the substance of what membership actually buys, and the
 * only genuinely rich imagery on the page. It gets an asymmetric grid and a
 * lead image at full height rather than seven equal thumbnails: a uniform grid
 * says "seven of the same", and the point is that these are different worlds.
 *
 * `highlight` receives the focus areas a member chose during enrolment, which
 * get an aqua edge and a badge.
 */
export function ServicesSection({ highlight = [] }: { highlight?: string[] }) {
  const t = useTranslations("verticals");
  const tServices = useTranslations("services");

  const [lead, ...rest] = SERVICES;
  const leadFocus = highlight.includes(lead.focusKey);

  return (
    <section id="verticals" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Left-aligned, with the sentence beside the heading rather than under
            it — the third centred stack in a row was starting to drone. */}
        <div
          data-reveal
          className="grid gap-6 border-b border-line pb-10 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:items-end"
        >
          <div>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 className="mt-4 font-display text-[32px] font-light leading-[1.1] text-ink sm:text-[42px]">
              {t("exploreTitle")}
            </h2>
          </div>
          <p className="text-[14.5px] leading-[1.75] text-ink-soft md:pb-2">
            {t("exploreSubtitle")}
          </p>
        </div>

        <div className="mt-10 grid gap-x-6 gap-y-10 md:grid-cols-3">
          {/* The lead runs full height beside the others. */}
          <figure data-reveal className="group flex flex-col md:row-span-2">
            <div
              className={`relative aspect-3/4 flex-1 overflow-hidden rounded-[22px] ring-1 transition-all duration-500 group-hover:ring-aqua-400 md:aspect-auto ${
                leadFocus ? "ring-aqua-400" : "ring-line"
              }`}
            >
              <Image
                src={lead.image}
                alt={tServices(lead.messageKey)}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
                priority
              />
              <div
                className="absolute inset-0 opacity-25 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-10"
                style={{
                  background: `linear-gradient(165deg, transparent 30%, ${lead.tint} 100%)`,
                }}
              />
              {leadFocus && <FocusBadge label={t("yourFocus")} />}
            </div>
            <Caption
              label={tServices(lead.messageKey)}
              size="lg"
            />
          </figure>

          {rest.map((service, index) => {
            const isFocus = highlight.includes(service.focusKey);
            // Seven tiles in three columns leave one cell empty on the last
            // row; the final vertical widens to close it.
            const isLast = index === rest.length - 1;
            /* The wide tile is taller than the square one beside it, which left
               their captions on different baselines. Pinning the last row to one
               height puts them back on the same line. */
            const inLastRow = index >= rest.length - 2;
            return (
              <figure
                key={service.messageKey}
                className={`group ${isLast ? "md:col-span-2" : ""}`}
              >
                <div
                  className={`relative overflow-hidden ${
                    isLast ? "aspect-16/9" : "aspect-4/3"
                  } ${inLastRow ? "md:aspect-auto md:h-[17rem]" : ""} rounded-[22px] ring-1 transition-all duration-500 group-hover:ring-aqua-400 ${
                    isFocus ? "ring-aqua-400" : "ring-line"
                  }`}
                >
                  <Image
                    src={service.image}
                    alt={tServices(service.messageKey)}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
                  />
                  <div
                    className="absolute inset-0 opacity-25 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-10"
                    style={{
                      background: `linear-gradient(165deg, transparent 35%, ${service.tint} 100%)`,
                    }}
                  />
                  {isFocus && <FocusBadge label={t("yourFocus")} />}
                </div>
                <Caption label={tServices(service.messageKey)} />
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FocusBadge({ label }: { label: string }) {
  return (
    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-paper/90 px-2.5 py-1 shadow-sm backdrop-blur-sm">
      <Star className="h-2.5 w-2.5 fill-aqua-500 text-aqua-500" strokeWidth={1.5} />
      <span className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-aqua-700">
        {label}
      </span>
    </span>
  );
}

/* Caption below the image: over a photograph it would need a dark scrim, and
   seven scrims would drag the section back toward the old dark theme. */
function Caption({ label, size = "md" }: { label: string; size?: "md" | "lg" }) {
  return (
    <figcaption className="mt-4 flex items-start justify-between gap-2">
      <p
        className={
          size === "lg"
            ? "font-display text-[19px] font-medium leading-snug text-ink"
            : "text-[14px] font-medium leading-snug text-ink"
        }
      >
        {label}
      </p>
      <ArrowUpRight
        className="h-4 w-4 shrink-0 translate-y-1 text-aqua-500 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
        strokeWidth={1.6}
      />
    </figcaption>
  );
}
