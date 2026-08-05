import { useTranslations } from "next-intl";
import { BadgeCheck, EyeOff, ShieldCheck } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const tCta = useTranslations("cta");

  const trust = [
    { icon: ShieldCheck, label: tCta("secure") },
    { icon: EyeOff, label: tCta("discreet") },
    { icon: BadgeCheck, label: tCta("trustworthy") },
  ];

  return (
    <footer className="relative mt-auto border-t border-white/8 bg-ink-900 pb-10 pt-12">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          {trust.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-2 text-[12px] text-mist-dim"
            >
              <item.icon
                className="h-[14px] w-[14px] text-teal-400"
                strokeWidth={1.5}
              />
              {item.label}
            </span>
          ))}
        </div>

        <hr className="rule-gold mx-auto my-8 w-full max-w-sm" />

        <p className="text-center text-[12px] text-mist-faint">
          {t("waitlistNote")}
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-[11.5px] text-mist-faint/80">{t("copyright")}</p>
          <div className="flex items-center gap-5 text-[11.5px] text-mist-faint/80">
            <span className="cursor-default transition-colors hover:text-mist-dim">
              {t("privacy")}
            </span>
            <span className="cursor-default transition-colors hover:text-mist-dim">
              {t("imprint")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
