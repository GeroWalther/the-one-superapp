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
    <section id="philosophy" className="scroll-mt-24">
      {/* Full-bleed, not a contained box. This is the only saturated surface on
          the page and the only place the scroll changes colour entirely; boxing
          it inside the same margins as everything else wasted that. */}
      <div className="band-accent relative overflow-hidden py-3 sm:py-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #fff 0%, transparent 45%), radial-gradient(circle at 80% 70%, #fff 0%, transparent 40%)",
          }}
        />
        <div data-reveal className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/75">
            {t("eyebrow")}
          </p>
          <hr className="mx-auto mt-6 w-24 border-0 border-t border-white/40" />
          <blockquote className="mt-8">
            <p className="font-display text-[27px] font-light italic leading-[1.45] text-white sm:text-[36px]">
              “{t("quote")}”
            </p>
          </blockquote>
          <p className="mt-7 text-[11px] uppercase tracking-[0.22em] text-white/70">
            {t("attribution")}
          </p>
        </div>
      </div>

      {/* The three refusals, back on paper — stated as a row of claims rather
          than centred cards, so they read as terms rather than features. */}
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20 lg:px-8">
        <dl className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {points.map((point, index) => (
            <div
              key={point.title}
              data-reveal
              data-reveal-delay={`${index * 110}`}
              className="bg-paper px-6 py-8"
            >
              <point.icon
                className="h-[19px] w-[19px] text-aqua-500"
                strokeWidth={1.4}
              />
              <dt className="mt-4 text-[15px] font-semibold tracking-wide text-ink">
                {point.title}
              </dt>
              <dd className="mt-2 text-[13px] leading-[1.7] text-ink-soft">
                {point.desc}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
