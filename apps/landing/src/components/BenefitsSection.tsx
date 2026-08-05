import { useTranslations } from "next-intl";
import { Cpu, Sparkles, TrendingUp } from "lucide-react";

export function BenefitsSection() {
  const t = useTranslations("benefits");

  const benefits = [
    {
      icon: Sparkles,
      title: t("exclusiveAccess"),
      desc: t("exclusiveAccessDesc"),
    },
    {
      icon: Cpu,
      title: t("innovativeTech"),
      desc: t("innovativeTechDesc"),
    },
    {
      icon: TrendingUp,
      title: t("maxSuccess"),
      desc: t("maxSuccessDesc"),
    },
  ];

  return (
    <section id="benefits" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div data-reveal className="mx-auto max-w-xl text-center">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-4 font-display text-[28px] font-light leading-tight text-mist sm:text-[36px]">
            {t.rich("title", {
              em: (chunks) => (
                <em className="font-light italic text-mist-dim">{chunks}</em>
              ),
              strong: (chunks) => (
                <span className="text-gradient-gold font-medium">{chunks}</span>
              ),
            })}
          </h2>
          <p className="mt-4 text-[14px] text-mist-dim">{t("subtitle")}</p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              data-reveal
              data-reveal-delay={`${index * 110}`}
              className="glass-soft lift rounded-[20px] p-6 text-center"
            >
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold-300/22 bg-gold-300/8">
                <benefit.icon
                  className="h-5 w-5 text-gold-300"
                  strokeWidth={1.3}
                />
              </span>
              <h3 className="mt-5 text-[14.5px] font-semibold text-mist">
                {benefit.title}
              </h3>
              <p className="mt-1.5 text-[12.5px] text-mist-dim">
                {benefit.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
