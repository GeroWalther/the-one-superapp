import { useLocale, useTranslations } from "next-intl";
import { BadgeCheck, EyeOff, ShieldCheck } from "lucide-react";
import { Wordmark } from "./Wordmark";

export function Footer() {
  const t = useTranslations("footer");
  const tCta = useTranslations("cta");
  const locale = useLocale();

  const trust = [
    { icon: ShieldCheck, label: tCta("secure") },
    { icon: EyeOff, label: tCta("discreet") },
    { icon: BadgeCheck, label: tCta("trustworthy") },
  ];

  return (
    /* The page ends in the dark. A pale footer let the whole thing trail off
       into the same white it started in; deep petrol closes it like a cover
       closing, and dark grounds with gold on them are what the eye reads as
       exclusive — the same pairing the members' cards use. The gradient runs
       to near-black at the base so the very bottom of the page is the darkest
       thing on it. */
    <footer className="relative mt-auto bg-gradient-to-b from-[#00383a] via-[#002527] to-[#001416] pb-12 pt-14 text-white">
      {/* One gold hairline across the top, the seam between the page and the
          close. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8a253]/70 to-transparent"
      />
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        {/* The mark on one side, everything it promises on the other: the
            three marks and the access note are one statement, so they share a
            block opposite the logo. The mark links home, which is what a
            reader at the bottom wants. */}
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark href={`/${locale}`} tone="light" large />

          {/* The three marks run in a row, with the access note under them:
              side by side they read as one line of credentials rather than as
              a list of three separate claims. */}
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
              {trust.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 text-[15px] text-white/75"
                >
                  <item.icon
                    className="h-[14px] w-[14px] text-[#e3bf72]"
                    strokeWidth={1.5}
                  />
                  {item.label}
                </span>
              ))}
            </div>
            <p className="text-center text-[15px] text-white/70 sm:text-right">
              {t("waitlistNote")}
            </p>
          </div>
        </div>

        <hr className="my-8 h-px w-full border-0 bg-gradient-to-r from-transparent via-[#c8a253]/45 to-transparent" />

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-[15px] text-white/55">{t("copyright")}</p>
          <div className="flex items-center gap-5 text-[15px] text-white/55">
            <span className="cursor-default transition-colors hover:text-white/85">
              {t("privacy")}
            </span>
            <span className="cursor-default transition-colors hover:text-white/85">
              {t("imprint")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
