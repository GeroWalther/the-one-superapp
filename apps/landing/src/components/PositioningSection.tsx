import { useTranslations } from "next-intl";

/**
 * The client's own description of what TheONE is, stated plainly and early.
 *
 * Reads from the `aboutPage` namespace rather than keeping a second copy: this
 * is one brand statement appearing on two surfaces, and two copies of it drift
 * the moment anyone edits one of them.
 */
export function PositioningSection() {
  const t = useTranslations("aboutPage");

  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
        <p
          data-reveal
          className="font-display text-[20px] font-light leading-[1.65] text-ink sm:text-[24px] sm:leading-[1.6]"
        >
          {t("intro")}
        </p>

        <div
          data-reveal
          data-reveal-delay="120"
          className="mt-8 flex items-center justify-center gap-4"
        >
          <span className="h-px w-12 bg-line" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-aqua-600">
            {t("tagline")}
          </span>
          <span className="h-px w-12 bg-line" />
        </div>
      </div>
    </section>
  );
}
