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
    <section className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-4 font-display text-[30px] font-light leading-tight text-mist sm:text-[38px]">
            {t.rich("title", {
              em: (chunks) => (
                <em className="text-gradient-gold not-italic">{chunks}</em>
              ),
            })}
          </h2>
          <p className="mt-4 text-[14.5px] leading-[1.75] text-mist-dim">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {pillars.map((pillar, index) => (
            <div
              key={pillar.title}
              data-reveal
              data-reveal-delay={`${index * 110}`}
              className="glass lift edge-gold rounded-[22px] p-7"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full border border-teal-400/25 bg-teal-400/10">
                <pillar.icon
                  className="h-[19px] w-[19px] text-teal-300"
                  strokeWidth={1.4}
                />
              </span>
              <h3 className="mt-5 font-display text-[21px] font-medium text-mist">
                {pillar.title}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-[1.7] text-mist-dim">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
