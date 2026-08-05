import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, CreditCard, FileText, KeyRound, ShieldCheck } from "lucide-react";

/**
 * Access here is an application, not a signup, and that is unusual enough that
 * hiding it until someone reaches the form would feel like a bait-and-switch.
 * This section states the four steps plainly, up front.
 */
export function ProcessSection() {
  const t = useTranslations("process");
  const locale = useLocale();

  const steps = [
    { icon: FileText, title: t("step1Title"), desc: t("step1Desc") },
    { icon: ShieldCheck, title: t("step2Title"), desc: t("step2Desc") },
    { icon: KeyRound, title: t("step3Title"), desc: t("step3Desc") },
    { icon: CreditCard, title: t("step4Title"), desc: t("step4Desc") },
  ];

  return (
    <section id="process" className="scroll-mt-24 py-20 sm:py-24">
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

        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              data-reveal
              data-reveal-delay={`${index * 90}`}
              className="glass-soft lift relative rounded-[20px] p-6"
            >
              <span className="absolute right-5 top-5 font-display text-[34px] font-light leading-none text-white/8">
                {index + 1}
              </span>
              <span className="grid h-11 w-11 place-items-center rounded-full border border-teal-400/25 bg-teal-400/10">
                <step.icon
                  className="h-[18px] w-[18px] text-teal-300"
                  strokeWidth={1.4}
                />
              </span>
              <h3 className="mt-5 text-[15px] font-semibold text-mist">
                {step.title}
              </h3>
              <p className="mt-2 text-[13px] leading-[1.7] text-mist-dim">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>

        <div data-reveal className="mt-12 text-center">
          <Link
            href={`/${locale}/enroll`}
            className="btn btn-gold px-7 py-3 text-[15px]"
          >
            {t("cta")}
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </Link>
          <p className="mt-4 text-[12.5px] text-mist-faint">{t("ctaNote")}</p>
        </div>
      </div>
    </section>
  );
}
