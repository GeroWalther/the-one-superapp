import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Check } from "lucide-react";
import { TombolaDrum } from "./TombolaDrum";

const BORDEAUX = "#6d1a2b";
const LIGHT_PETROL = "#bfe0e0";

/**
 * The Christmas giveaway, closing the page.
 *
 * Entry is the application itself, as a business or as a private individual,
 * so there is no second form to keep or data to store: the button leads to
 * the apply section above, where the visitor picks their path.
 *
 * Rich petrol ground with light petrol waves, and bordeaux for Christmas: the
 * headline sits on a bordeaux band and the button is bordeaux.
 */
export function GiveawaySection() {
  const t = useTranslations("giveaway");
  const locale = useLocale();

  return (
    <section id="giveaway" className="scroll-mt-24 pb-24 sm:pb-28">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div
          data-reveal
          className="relative overflow-hidden rounded-3xl px-6 pb-12 pt-12 text-center shadow-[0_30px_70px_-30px_rgba(0,37,42,0.7)] sm:px-12 sm:pb-14 sm:pt-14"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% 0%, #0b6b6b 0%, #005252 45%, #003b3b 100%)",
          }}
        >
          {/* Light petrol waves across the panel. */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 1000 800"
          >
            <defs>
              <linearGradient id="gv-ribbon" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={LIGHT_PETROL} stopOpacity="0" />
                <stop offset="50%" stopColor={LIGHT_PETROL} stopOpacity="0.22" />
                <stop offset="100%" stopColor={LIGHT_PETROL} stopOpacity="0.04" />
              </linearGradient>
            </defs>
            {[0, 140, 280, 420].map((offset) => (
              <path
                key={offset}
                d={`M-80,${200 + offset} C 260,${40 + offset} 640,${400 + offset} 1080,${130 + offset}`}
                fill="none"
                stroke="url(#gv-ribbon)"
                strokeWidth={110}
              />
            ))}
          </svg>

          <div className="relative">
            {/* The occasion on a bordeaux band, like the ribbon on a gift.
                Lining figures so "2026" stands as tall as the capitals. */}
            <h2
              className="mx-auto inline-block text-balance rounded-xl px-6 py-3 font-display text-[24px] font-bold uppercase leading-[1.15] tracking-[0.08em] text-white [font-variant-numeric:lining-nums] shadow-[0_14px_30px_-14px_rgba(0,0,0,0.6)] sm:px-9 sm:text-[34px]"
              style={{ background: BORDEAUX }}
            >
              {t("eyebrow")}
            </h2>

            <TombolaDrum onDark className="mx-auto mt-6 h-auto max-w-full" width={480} />

            {/* Set like "EVERYTHING THAT MATTERS TO YOU" above (bold caps,
                tracked out), in the footer's mirror gold, the same gold as the
                drum's rim. */}
            <p className="text-gold-gradient mt-6 text-balance font-display text-[clamp(24px,5.4vw,40px)] font-bold uppercase leading-[1.15] tracking-[0.06em]">
              {t.rich("title", {
                /* The two 12s in lining figures, so they stand as tall as the
                   capitals; the serif's default old-style figures sit at
                   x-height and look undersized in an all-caps line. */
                num: (chunks) => (
                  <span className="[font-variant-numeric:lining-nums]">{chunks}</span>
                ),
              })}
            </p>
            {/* "To win" as its own line, so the headline above keeps two even
                lines. Bordeaux type, as the client asked. */}
            <p
              className="mt-1 font-display text-[24px] font-bold italic leading-[1.2] sm:text-[30px]"
              /* 700 is the heaviest cut loaded; a hairline stroke in the same
                 colour thickens it further. */
              style={{ color: BORDEAUX, WebkitTextStroke: `0.8px ${BORDEAUX}` }}
            >
              {t("titleSub")}
            </p>
            <div className="mx-auto mt-3 max-w-xl text-pretty text-[16px] leading-[1.55] text-white/90 sm:text-[17px]">
              <p>{t("body")}</p>
              <p className="mt-3">{t("howTo")}</p>
              {/* Left-aligned inside a centred block, so the two ways in
                  read as a list without breaking the panel's axis. */}
              <ul className="mx-auto mt-2 inline-flex flex-col gap-1.5 text-left">
                {(["option1", "option2"] as const).map((key) => (
                  <li key={key} className="flex items-start gap-2.5">
                    <Check
                      className="mt-[5px] h-4 w-4 shrink-0"
                      strokeWidth={2.4}
                      style={{ color: LIGHT_PETROL }}
                    />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3">{t("deadline")}</p>
            </div>

            <a
              href="#apply"
              className="btn mt-6 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_30px_-14px_rgba(0,0,0,0.7)] hover:-translate-y-px hover:brightness-110"
              style={{ background: BORDEAUX }}
            >
              {t("cta")}
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </a>

            <p
              className="mx-auto mt-4 max-w-md text-pretty text-[13px] leading-[1.5]"
              style={{ color: LIGHT_PETROL }}
            >
              {t("note")}{" "}
              <Link
                href={`/${locale}/giveaway-terms`}
                className="whitespace-nowrap font-semibold text-white underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white"
              >
                {t("termsLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
