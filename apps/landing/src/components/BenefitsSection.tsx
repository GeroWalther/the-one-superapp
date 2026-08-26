import { useTranslations } from "next-intl";
import { Cpu, Sparkles, TrendingUp } from "lucide-react";

/**
 * A soft tinted band rather than a third grid of cards.
 *
 * By this point in the scroll the page has already used cards twice; a third
 * set reads as filler. A change of ground colour does the work instead — it
 * separates this from the sections either side without adding more boxes, and
 * it gives the eye somewhere to rest before the philosophy band.
 */
export function BenefitsSection() {
  const t = useTranslations("benefits");

  const benefits = [
    { icon: Sparkles, title: t("exclusiveAccess"), desc: t("exclusiveAccessDesc") },
    { icon: Cpu, title: t("innovativeTech"), desc: t("innovativeTechDesc") },
    { icon: TrendingUp, title: t("maxSuccess"), desc: t("maxSuccessDesc") },
  ];

  return (
    <section id="benefits" className="scroll-mt-24 bg-aqua-100/45 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:items-center lg:gap-16">
          <div data-reveal>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 className="mt-4 font-display text-[28px] font-light leading-[1.15] text-ink sm:text-[34px]">
              {t.rich("title", {
                em: (chunks) => (
                  <em className="font-light italic text-ink-soft">{chunks}</em>
                ),
                strong: (chunks) => (
                  <span className="text-accent font-medium">{chunks}</span>
                ),
              })}
            </h2>
            <p className="mt-4 max-w-sm text-[14px] leading-[1.7] text-ink-soft">
              {t("subtitle")}
            </p>
          </div>

          <ul className="grid gap-8 sm:grid-cols-3">
            {benefits.map((benefit, index) => (
              <li
                key={benefit.title}
                data-reveal
                data-reveal-delay={`${index * 110}`}
              >
                <benefit.icon
                  className="h-5 w-5 text-aqua-600"
                  strokeWidth={1.4}
                />
                <h3 className="mt-4 text-[14.5px] font-semibold text-ink">
                  {benefit.title}
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-[1.7] text-ink-soft">
                  {benefit.desc}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
