import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Lock } from "lucide-react";
import { SERVICES } from "@/lib/services";

/**
 * The public teaser: the real member grid, blurred and locked, with the
 * application CTA sitting on top of it.
 */
export function LockedPreviewSection() {
  const t = useTranslations("teaser");
  const tServices = useTranslations("services");
  const locale = useLocale();

  return (
    <section id="inside" className="relative scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
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

        <div data-reveal data-reveal-delay="120" className="relative mt-14">
          {/* The grid itself — decorative here, so it is hidden from AT */}
          <div
            aria-hidden="true"
            className="pointer-events-none grid select-none grid-cols-2 gap-2.5 sm:grid-cols-4"
          >
            {SERVICES.map((service) => (
              <div
                key={service.messageKey}
                className={`relative overflow-hidden rounded-[16px] ring-1 ring-white/8 ${
                  service.span ?? ""
                }`}
                style={{
                  aspectRatio: service.span?.includes("row-span-2")
                    ? undefined
                    : "4/3",
                }}
              >
                <Image
                  src={service.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="scale-110 object-cover blur-[7px]"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(160deg, ${service.tint}e6 0%, ${service.tint}b3 55%, rgba(4,7,10,0.8) 100%)`,
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center">
                  <Lock
                    className="h-4 w-4 text-gold-300/70"
                    strokeWidth={1.5}
                  />
                  <p className="text-[11.5px] font-medium tracking-wide text-mist/75 sm:text-[12.5px]">
                    {tServices(service.messageKey)}
                  </p>
                  <p className="text-[9px] uppercase tracking-[0.22em] text-mist-faint">
                    {t("locked")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Fade the grid into the page so it reads as "more below" */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-900 via-ink-900/85 to-transparent" />

          {/* Unlock panel */}
          <div className="absolute inset-x-0 bottom-0 flex justify-center px-4 sm:bottom-4">
            <div className="glass edge-gold w-full max-w-md rounded-[24px] px-7 py-8 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold-300/30 bg-gold-300/10">
                <Lock className="h-5 w-5 text-gold-300" strokeWidth={1.5} />
              </span>
              <h3 className="mt-5 font-display text-[23px] font-medium text-mist">
                {t("unlockTitle")}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-[1.7] text-mist-dim">
                {t("unlockBody")}
              </p>
              <Link
                href={`/${locale}/enroll`}
                className="btn btn-gold mt-6 w-full py-3 text-[14.5px]"
              >
                {t("unlockCta")}
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
              <p className="mt-4 text-[12.5px] text-mist-faint">
                {t("haveAccount")}{" "}
                <Link
                  href={`/${locale}/login`}
                  className="text-gold-300 underline-offset-4 transition-colors hover:text-gold-200 hover:underline"
                >
                  {t("signIn")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
