import { useTranslations } from "next-intl";
import { EyeOff, Gem, Scale } from "lucide-react";

export function PhilosophySection() {
  const t = useTranslations("philosophy");

  const points = [
    { icon: Gem, title: t("point1Title"), desc: t("point1Desc") },
    { icon: Scale, title: t("point2Title"), desc: t("point2Desc") },
    { icon: EyeOff, title: t("point3Title"), desc: t("point3Desc") },
  ];

  return (
    <section
      id="philosophy"
      className="grain relative scroll-mt-24 overflow-hidden py-24 sm:py-28"
    >
      <div className="aurora" />

      <div className="relative mx-auto max-w-4xl px-6 lg:px-8">
        {/* The one saturated surface on the page. It carries the promise, so it
            gets the colour; everything else stays on paper. */}
        <div
          data-reveal
          className="band-accent relative overflow-hidden rounded-[28px] px-8 py-14 text-center sm:px-14 sm:py-16"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/75">
            {t("eyebrow")}
          </p>
          <hr className="mx-auto mt-6 w-24 border-0 border-t border-white/40" />
          <blockquote className="mt-8">
            <p className="font-display text-[26px] font-light italic leading-[1.45] text-white sm:text-[34px]">
              “{t("quote")}”
            </p>
          </blockquote>
          <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-white/70">
            {t("attribution")}
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {points.map((point, index) => (
            <div
              key={point.title}
              data-reveal
              data-reveal-delay={`${index * 110}`}
              className="text-center"
            >
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-line bg-paper-soft">
                <point.icon
                  className="h-[18px] w-[18px] text-aqua-500"
                  strokeWidth={1.4}
                />
              </span>
              <h3 className="mt-4 text-[14.5px] font-semibold tracking-wide text-ink">
                {point.title}
              </h3>
              <p className="mx-auto mt-2 max-w-[24ch] text-[13px] leading-[1.7] text-ink-soft">
                {point.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
