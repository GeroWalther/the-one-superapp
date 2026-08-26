import { useTranslations } from "next-intl";
import { CreditCard, Link2, ScanSearch } from "lucide-react";

export function PillarsSection() {
  const t = useTranslations("pillars");

  const pillars = [
    {
      icon: ScanSearch,
      title: t("decisionTitle"),
      desc: t("decisionDesc"),
    },
    {
      icon: Link2,
      title: t("connectionTitle"),
      desc: t("connectionDesc"),
    },
    {
      icon: CreditCard,
      title: t("transactionTitle"),
      desc: t("transactionDesc"),
    },
  ];

  return (
    <section className="relative py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Heading on the left, the three layers stacked to its right. The card
            chrome is gone: three bordered boxes made these read as options to
            choose between, when they are one system described in three parts. */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div data-reveal>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 className="mt-4 font-display text-[32px] font-light leading-[1.1] text-ink sm:text-[42px]">
              {t.rich("title", {
                em: (chunks) => (
                  <em className="text-accent not-italic">{chunks}</em>
                ),
              })}
            </h2>
            <p className="mt-5 max-w-sm text-[14.5px] leading-[1.75] text-ink-soft">
              {t("subtitle")}
            </p>
          </div>

          <dl className="divide-y divide-line border-t border-line">
            {pillars.map((pillar, index) => (
              <div
                key={pillar.title}
                data-reveal
                data-reveal-delay={`${index * 100}`}
                className="group flex gap-5 py-7"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-aqua-500/25 bg-aqua-500/10 transition-colors duration-500 group-hover:bg-aqua-500/20">
                  <pillar.icon
                    className="h-[19px] w-[19px] text-aqua-500"
                    strokeWidth={1.4}
                  />
                </span>
                <div>
                  <dt className="font-display text-[21px] font-medium text-ink">
                    {pillar.title}
                  </dt>
                  <dd className="mt-2 max-w-md text-[13.5px] leading-[1.75] text-ink-soft">
                    {pillar.desc}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
