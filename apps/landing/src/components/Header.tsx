"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();

  return (
    <header className="absolute left-0 right-0 top-0 z-50 w-full">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6 sm:h-24 lg:px-8">
        <Link href={`/${locale}`} className="flex items-center">
          <img
            src="/images/app-icon.jpeg"
            alt="TheONE Super App"
            className="h-16 w-16 rounded-[14px] shadow-sm sm:h-20 sm:w-20"
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href={`/${locale}#benefits`}
            className="text-[13px] font-semibold text-[#444] hover:text-[#111]"
          >
            {t("features")}
          </Link>
          <Link
            href={`/${locale}/about`}
            className="text-[13px] font-semibold text-[#444] hover:text-[#111]"
          >
            {t("about")}
          </Link>

          <a href={`/${locale}#join`} className="hero-cta-btn inline-block">
            <span className="hero-cta-btn__ring inline-block rounded-full p-[1.5px]">
              <span className="hero-cta-btn__inner block rounded-full px-5 py-1.5 text-[12px] font-medium tracking-normal text-white transition-colors">
                {t("joinNow")}
              </span>
            </span>
          </a>

          <LocaleSwitcher currentLocale={locale} />

          <a
            href="#"
            aria-label="Download app"
            className="rounded-full bg-[#111] px-5 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-80"
          >
            {t("download")}
          </a>
        </nav>

        <div className="flex items-center md:hidden">
          <LocaleSwitcher currentLocale={locale} />
        </div>
      </div>
    </header>
  );
}

function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const locales = ["de", "en"] as const;

  return (
    <div className="inline-flex items-center rounded-full border border-[#d8d8d8] bg-white/80 p-[2px] backdrop-blur">
      {locales.map((loc) => {
        const isActive = currentLocale === loc;
        return (
          <Link
            key={loc}
            href={`/${loc}`}
            aria-current={isActive ? "true" : undefined}
            className={
              isActive
                ? "rounded-full bg-[#111] px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-wider text-white"
                : "rounded-full px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-wider text-[#888] hover:text-[#111]"
            }
          >
            {loc}
          </Link>
        );
      })}
    </div>
  );
}
