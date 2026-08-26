import { useTranslations } from "next-intl";

/**
 * One row, one line.
 *
 * The footer used to carry a rule, a note and a two-column row on generous
 * padding — three horizontal lines stacked at the end of a page that already
 * ends with a bordered section. Everything sits on a single row now, with the
 * top border as the only rule.
 */
export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-auto border-t border-line bg-paper py-5">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-x-6 gap-y-2 px-6 text-[11.5px] text-ink-faint sm:flex-row sm:justify-between lg:px-8">
        <p>{t("copyright")}</p>

        <p className="order-first text-center sm:order-none">
          {t("waitlistNote")}
        </p>

        <div className="flex items-center gap-5">
          <span className="cursor-default transition-colors hover:text-ink-soft">
            {t("privacy")}
          </span>
          <span className="cursor-default transition-colors hover:text-ink-soft">
            {t("imprint")}
          </span>
        </div>
      </div>
    </footer>
  );
}
