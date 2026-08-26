import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Building2, Check, UserRound } from "lucide-react";

/**
 * What each side actually gets, side by side.
 *
 * The page's job is to get the right person into the right form, and members
 * and partners want entirely different things — one wants advice they can
 * trust, the other wants to be found. Everything before this said what TheONE
 * *is*; this is the first section that says what the visitor *receives*.
 *
 * Price is stated here rather than after approval. It is the question both
 * audiences arrive with, and an applicant who only learns it once a reviewer
 * has already read their file costs a decision cycle that was never going to
 * convert.
 */
export function AudienceSection() {
  const t = useTranslations("audience");
  const locale = useLocale();

  const paths = [
    {
      key: "member",
      icon: UserRound,
      title: t("memberTitle"),
      lead: t("memberLead"),
      points: [
        { title: t("memberPoint1"), desc: t("memberPoint1Desc") },
        { title: t("memberPoint2"), desc: t("memberPoint2Desc") },
        { title: t("memberPoint3"), desc: t("memberPoint3Desc") },
      ],
      price: t("memberPrice"),
      unit: t("memberPriceUnit"),
      note: t("memberPriceNote"),
      cta: t("memberCta"),
      href: `/${locale}#apply`,
    },
    {
      key: "partner",
      icon: Building2,
      title: t("partnerTitle"),
      lead: t("partnerLead"),
      points: [
        { title: t("partnerPoint1"), desc: t("partnerPoint1Desc") },
        { title: t("partnerPoint2"), desc: t("partnerPoint2Desc") },
        { title: t("partnerPoint3"), desc: t("partnerPoint3Desc") },
      ],
      price: t("partnerPrice"),
      unit: t("partnerPriceUnit"),
      note: t("partnerPriceNote"),
      cta: t("partnerCta"),
      href: `/${locale}#apply`,
    },
  ];

  return (
    <section id="audience" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-4 font-display text-[30px] font-light leading-tight text-ink sm:text-[38px]">
            {t("title")}
          </h2>
          <p className="mt-4 text-[14.5px] leading-[1.75] text-ink-soft">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {paths.map((path, index) => (
            <div
              key={path.key}
              data-reveal
              data-reveal-delay={`${index * 120}`}
              className="card-brand flex flex-col p-8 sm:p-10"
            >
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-aqua-500/25 bg-aqua-500/10">
                  <path.icon className="h-5 w-5 text-aqua-500" strokeWidth={1.4} />
                </span>
                <h3 className="font-display text-[24px] font-medium text-ink">
                  {path.title}
                </h3>
              </div>

              <p className="mt-5 text-[14px] leading-[1.75] text-ink-soft">
                {path.lead}
              </p>

              <ul className="mt-7 flex-1 space-y-5 border-t border-line pt-7">
                {path.points.map((point) => (
                  <li key={point.title} className="flex gap-3.5">
                    <Check
                      className="mt-[3px] h-4 w-4 shrink-0 text-aqua-500"
                      strokeWidth={2.2}
                    />
                    <div>
                      <p className="text-[14.5px] font-semibold text-ink">
                        {point.title}
                      </p>
                      <p className="mt-1 text-[13px] leading-[1.7] text-ink-soft">
                        {point.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Stated before the form, not after approval. */}
              <div className="mt-8 border-t border-line pt-7">
                <p className="flex items-baseline gap-2">
                  <span className="font-display text-[34px] font-light leading-none text-ink">
                    {path.price}
                  </span>
                  <span className="text-[13.5px] text-ink-soft">{path.unit}</span>
                </p>
                <p className="mt-2 text-[12.5px] text-ink-faint">{path.note}</p>

                <Link
                  href={path.href}
                  className="btn btn-primary mt-6 w-full py-3 text-[14.5px]"
                >
                  {path.cta}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
