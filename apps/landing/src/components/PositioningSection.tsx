import { useTranslations } from "next-intl";

/**
 * The client's own description of what the AI does, stated plainly and early.
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
        {/* The claim stays English in the German build, as the page's other
            claims do — "YOUR WORLD YOUR MATCH", "ONE WORLD ONE POWER AI". */}
        <h2
          data-reveal
          /* One line at every width. Two things make that possible: the size
             follows the viewport rather than stepping (the claim needs 20.1x
             its own font-size to set on one line, so 4.7vw is the largest that
             always fits), and -mx-4 gives back most of the section's gutter on
             a phone, where those 48px are the difference between fitting and
             not. Capped at 34px, which is what the column can hold. */
          className="-mx-4 whitespace-nowrap font-display text-[min(4.7vw,34px)] font-bold leading-[1.2] tracking-[0.05em] text-[#0a2f34] sm:mx-0"
        >
          {t("introTitle")}
        </h2>

        <p
          data-reveal
          data-reveal-delay="80"
          className="mt-8 font-display text-[20px] font-light leading-[1.65] text-ink sm:text-[24px] sm:leading-[1.6]"
        >
          {t("intro")}
        </p>

        {/* The second paragraph is set smaller and quieter than the first: it
            explains, where the first asks the reader to imagine. */}
        <p
          data-reveal
          data-reveal-delay="140"
          className="mx-auto mt-6 max-w-2xl text-[15px] leading-[1.85] text-ink-soft sm:text-[16.5px]"
        >
          {t("intro2")}
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
