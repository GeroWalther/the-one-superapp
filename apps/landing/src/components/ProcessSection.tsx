import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

/**
 * Access here is an application, not a signup, and that is unusual enough that
 * hiding it until someone reaches the form would feel like a bait-and-switch.
 * This section states the four steps plainly, up front.
 *
 * Laid out as a numbered sequence beside a single image rather than four cards.
 * Four equal cards imply four parallel options; these are ordered stages, and a
 * vertical run of numbers says so without a word of explanation. It also breaks
 * the centred-heading-over-a-grid rhythm the rest of the page had fallen into.
 */
export function ProcessSection() {
  const t = useTranslations("process");
  const locale = useLocale();

  const steps = [
    { title: t("step1Title"), desc: t("step1Desc") },
    { title: t("step2Title"), desc: t("step2Desc") },
    { title: t("step3Title"), desc: t("step3Desc") },
    { title: t("step4Title"), desc: t("step4Desc") },
  ];

  return (
    <section id="process" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:items-start lg:gap-16">
          {/* --- left: the argument, and one image ------------------------ */}
          <div data-reveal className="lg:sticky lg:top-28">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 className="mt-4 font-display text-[32px] font-light leading-[1.1] text-ink sm:text-[42px]">
              {t.rich("title", {
                em: (chunks) => <em className="text-accent not-italic">{chunks}</em>,
              })}
            </h2>
            <p className="mt-5 max-w-md text-[14.5px] leading-[1.75] text-ink-soft">
              {t("subtitle")}
            </p>

            <div className="relative mt-9 aspect-4/3 overflow-hidden rounded-[24px] ring-1 ring-line">
              <Image
                /* A quiet interior rather than the obvious handshake-and-high-five stock:
                   the brand sells discretion, and celebratory office photography
                   undercuts that faster than any wording can fix. */
                src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&h=900&fit=crop&q=80"
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-aqua-700/25 via-transparent to-transparent" />
            </div>

            <div className="mt-8">
              <Link
                href={`/${locale}#apply`}
                className="btn btn-primary px-7 py-3 text-[15px]"
              >
                {t("cta")}
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
              <p className="mt-4 text-[12.5px] text-ink-faint">{t("ctaNote")}</p>
            </div>
          </div>

          {/* --- right: the stages ---------------------------------------- */}
          <ol className="relative">
            {/* The spine that makes four items read as one sequence. */}
            <span
              aria-hidden="true"
              className="absolute left-[23px] top-3 bottom-3 w-px bg-gradient-to-b from-aqua-200 via-aqua-200 to-transparent"
            />

            {steps.map((step, index) => (
              <li
                key={step.title}
                data-reveal
                data-reveal-delay={`${index * 90}`}
                className="relative flex gap-6 pb-10 last:pb-0"
              >
                <span className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full border border-aqua-200 bg-paper font-display text-[17px] text-aqua-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="pt-2">
                  <h3 className="font-display text-[21px] font-medium text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-sm text-[13.5px] leading-[1.75] text-ink-soft">
                    {step.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
