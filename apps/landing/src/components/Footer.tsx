import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");


  return (
    <footer className="relative mt-auto border-t border-line bg-paper pb-10 pt-12">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">

        <hr className="rule-accent mx-auto my-8 w-full max-w-sm" />

        <p className="text-center text-[12px] text-ink-faint">
          {t("waitlistNote")}
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-[11.5px] text-ink-faint/80">{t("copyright")}</p>
          <div className="flex items-center gap-5 text-[11.5px] text-ink-faint/80">
            <span className="cursor-default transition-colors hover:text-ink-soft">
              {t("privacy")}
            </span>
            <span className="cursor-default transition-colors hover:text-ink-soft">
              {t("imprint")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
