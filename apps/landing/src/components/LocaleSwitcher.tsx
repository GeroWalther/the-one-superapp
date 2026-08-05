"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";

/**
 * Swaps the locale segment of the current path instead of jumping home, so
 * switching language on /enroll keeps you on /enroll.
 */
export function LocaleSwitcher() {
  const current = useLocale();
  const pathname = usePathname();

  function pathFor(locale: string) {
    const segments = pathname.split("/");
    if (routing.locales.includes(segments[1] as (typeof routing.locales)[number])) {
      segments[1] = locale;
      return segments.join("/") || `/${locale}`;
    }
    return `/${locale}${pathname === "/" ? "" : pathname}`;
  }

  return (
    <div className="inline-flex items-center rounded-full border border-line bg-paper-soft p-[3px] backdrop-blur">
      {routing.locales.map((locale) => {
        const isActive = current === locale;
        return (
          <Link
            key={locale}
            href={pathFor(locale)}
            aria-current={isActive ? "true" : undefined}
            className={
              isActive
                ? "rounded-full bg-aqua-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-paper"
                : "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint transition-colors hover:text-ink"
            }
          >
            {locale}
          </Link>
        );
      })}
    </div>
  );
}
