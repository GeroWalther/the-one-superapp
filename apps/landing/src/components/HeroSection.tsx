import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { PhoneMockup } from "./PhoneMockup";

export function HeroSection() {
  const t = useTranslations("hero");
  const locale = useLocale();

  const stats = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
  ];

  return (
    <section className="grain relative overflow-hidden pb-24 pt-[132px] sm:pb-28 lg:pb-36 lg:pt-[150px]">
      <div className="silk">
      </div>

      {/* Fine grid, masked to a soft ellipse. Aqua rather than ink — on paper a
          grey grid reads as dirt, a tinted one reads as structure. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(46,156,168,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(46,156,168,.13) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 90% 62% at 50% 32%, #000 20%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 62% at 50% 32%, #000 20%, transparent 72%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex flex-col items-center gap-16 lg:flex-row lg:items-center lg:gap-10">
          <div className="max-w-xl flex-1 text-center lg:text-left">
            <span
              data-reveal
              className="inline-flex items-center gap-2 rounded-full border border-aqua-500/25 bg-aqua-500/10 px-3.5 py-1.5"
            >
              <span className="pulse-ring block h-1.5 w-1.5 rounded-full bg-aqua-500" />
              <span className="eyebrow">{t("eyebrow")}</span>
            </span>

            <h1
              data-reveal
              data-reveal-delay="80"
              className="mt-7 font-display text-[42px] font-light leading-[1.04] tracking-[-0.02em] text-ink sm:text-[56px] lg:text-[64px]"
            >
              {t("titleLine1")}
              <span className="text-accent mt-1 block italic">
                {t("titleAccent")}
              </span>
            </h1>

            <p
              data-reveal
              data-reveal-delay="160"
              className="mx-auto mt-6 max-w-lg text-[15px] leading-[1.75] text-ink-soft lg:mx-0"
            >
              {t("subtitle")}
            </p>

            <div
              data-reveal
              data-reveal-delay="240"
              className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
            >
              <Link
                href={`/${locale}/enroll`}
                className="btn btn-primary w-full px-7 py-3 text-[15px] sm:w-auto"
              >
                {t("cta")}
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
              <Link
                href={`/${locale}#process`}
                className="btn btn-ghost w-full px-7 py-3 text-[15px] sm:w-auto"
              >
                {t("ctaSecondary")}
              </Link>
            </div>

            <p
              data-reveal
              data-reveal-delay="300"
              className="mt-6 flex items-center justify-center gap-2 text-[12px] italic text-ink-faint lg:justify-start"
            >
              <ShieldCheck
                className="h-3.5 w-3.5 text-aqua-500"
                strokeWidth={1.6}
              />
              {t("clarity")}
            </p>
          </div>

          <div
            data-reveal
            data-reveal-delay="200"
            className="flex flex-1 justify-center lg:justify-end"
          >
            <div className="float-slow">
              <PhoneMockup />
            </div>
          </div>
        </div>

        <dl
          data-reveal
          data-reveal-delay="120"
          className="mt-20 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-[0_1px_2px_rgba(43,52,64,.04)] sm:mt-24"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-paper px-3 py-6 text-center sm:px-6 sm:py-7"
            >
              <dt className="text-accent font-display text-[30px] font-light leading-none sm:text-[38px]">
                {stat.value}
              </dt>
              <dd className="mt-2 text-[10px] uppercase tracking-[0.14em] text-ink-faint sm:text-[11.5px] sm:tracking-[0.16em]">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
