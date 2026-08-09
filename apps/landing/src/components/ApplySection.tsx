import { useTranslations } from "next-intl";
import { ApplyChooser } from "./ApplyChooser";

/**
 * Where the landing page's calls to action land.
 *
 * The form lives on the page rather than behind a navigation: everything a
 * visitor needs to decide is directly above it, and sending them elsewhere to
 * fill it in means losing the argument that convinced them.
 */
export function ApplySection({ inviteCode }: { inviteCode?: string }) {
  const t = useTranslations("enroll");

  return (
    <section id="apply" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl px-6 lg:px-8">
        <div data-reveal className="text-center">
          <p className="eyebrow">{t("chooser.eyebrow")}</p>
          <h2 className="mt-4 font-display text-[30px] font-light leading-tight text-ink sm:text-[38px]">
            {t("chooser.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-[1.75] text-ink-soft">
            {t("chooser.subtitle")}
          </p>
        </div>

        <div data-reveal data-reveal-delay="120" className="mt-10">
          <ApplyChooser inviteCode={inviteCode} />
        </div>
      </div>
    </section>
  );
}
