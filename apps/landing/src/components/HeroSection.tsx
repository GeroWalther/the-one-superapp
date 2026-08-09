import Image from "next/image";
import { useTranslations } from "next-intl";
import { Building2, ShieldCheck, UserRound } from "lucide-react";

export function HeroSection() {
  const t = useTranslations("hero");
  const tEnroll = useTranslations("enroll");

  const stats = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
  ];

  return (
    <section className="grain relative overflow-hidden pb-20 pt-[122px] sm:pb-24 lg:pt-[140px]">
      <div className="silk"></div>

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

      <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
        {/* The mark leads. It is the strongest brand asset here, and a visitor
            who arrives from an ad or an app listing should recognise it before
            reading a word. */}
        <div data-reveal className="flex justify-center">
          <div className="float-slow relative">
            <div
              aria-hidden="true"
              className="absolute -inset-8 rounded-full bg-aqua-200/40 blur-3xl"
            />
            <Image
              src="/images/theone-logo.png"
              alt="TheONE Super App"
              width={168}
              height={168}
              priority
              className="relative rounded-[34px] shadow-[0_28px_60px_-28px_rgba(34,126,137,0.55)] sm:h-[184px] sm:w-[184px]"
            />
          </div>
        </div>

        <span
          data-reveal
          data-reveal-delay="60"
          className="mt-9 inline-flex items-center gap-2 rounded-full border border-aqua-500/25 bg-aqua-500/10 px-3.5 py-1.5"
        >
          <span className="pulse-ring block h-1.5 w-1.5 rounded-full bg-aqua-500" />
          <span className="eyebrow">{t("eyebrow")}</span>
        </span>

        <h1
          data-reveal
          data-reveal-delay="120"
          className="mt-6 font-display text-[42px] font-light leading-[1.04] tracking-[-0.02em] text-ink sm:text-[56px] lg:text-[62px]"
        >
          {t("titleLine1")}
          <span className="text-accent mt-1 block italic">
            {t("titleAccent")}
          </span>
        </h1>

        <p
          data-reveal
          data-reveal-delay="180"
          className="mx-auto mt-6 max-w-xl text-[15px] leading-[1.75] text-ink-soft"
        >
          {t("subtitle")}
        </p>

        {/* Two doors rather than one. "Apply" alone made a partner wonder
            whether the platform was for them at all. */}
        <div
          data-reveal
          data-reveal-delay="240"
          className="mt-10 grid gap-3 sm:grid-cols-2"
        >
          <a href="#apply" className="card-brand-soft group flex items-center gap-4 p-5 text-left">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-aqua-500/25 bg-aqua-500/10">
              <UserRound className="h-5 w-5 text-aqua-500" strokeWidth={1.4} />
            </span>
            <span>
              <span className="block text-[14.5px] font-semibold text-ink">
                {tEnroll("chooser.memberTitle")}
              </span>
              <span className="mt-0.5 block text-[12px] text-ink-faint">
                {tEnroll("chooser.memberMeta")}
              </span>
            </span>
          </a>

          <a href="#apply" className="card-brand-soft group flex items-center gap-4 p-5 text-left">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-aqua-500/25 bg-aqua-500/10">
              <Building2 className="h-5 w-5 text-aqua-500" strokeWidth={1.4} />
            </span>
            <span>
              <span className="block text-[14.5px] font-semibold text-ink">
                {tEnroll("chooser.partnerTitle")}
              </span>
              <span className="mt-0.5 block text-[12px] text-ink-faint">
                {tEnroll("chooser.partnerMeta")}
              </span>
            </span>
          </a>
        </div>

        <p
          data-reveal
          data-reveal-delay="300"
          className="mt-6 flex items-center justify-center gap-2 text-[12px] italic text-ink-faint"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-aqua-500" strokeWidth={1.6} />
          {t("clarity")}
        </p>

        <dl
          data-reveal
          data-reveal-delay="340"
          className="mt-14 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-[0_1px_2px_rgba(43,52,64,.04)]"
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
