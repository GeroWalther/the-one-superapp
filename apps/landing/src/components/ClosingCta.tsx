import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

/**
 * The last thing on the page, and the only thing on it.
 *
 * Since applying moved onto its own page per audience, the landing page ended
 * on the philosophy band with nothing to act on — a visitor who read the whole
 * argument had to scroll back up to do anything about it. Both doors again
 * here, because by this point someone knows which one they are.
 */
export function ClosingCta() {
  const t = useTranslations("audience");
  const tEnroll = useTranslations("enroll");
  const locale = useLocale();

  return (
    <section className="border-t border-line py-12 sm:py-14">
      {/* No data-reveal here on purpose: this is the last thing before the
          footer, so if the observer ever misses it the page ends on a blank. */}
      <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
        <h2 className="font-display text-[26px] font-light leading-tight text-ink sm:text-[32px]">
          {t("title")}
        </h2>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={`/${locale}/enroll/member`}
            className="btn btn-primary w-full px-8 py-3 text-[14.5px] sm:w-auto"
          >
            {t("memberCta")}
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </Link>
          <Link
            href={`/${locale}/enroll/partner`}
            className="btn btn-ghost w-full px-8 py-3 text-[14.5px] sm:w-auto"
          >
            {t("partnerCta")}
          </Link>
        </div>

        <p className="mt-6 text-[12.5px] leading-[1.7] text-ink-faint">
          {tEnroll("chooser.process")}
        </p>
      </div>
    </section>
  );
}
