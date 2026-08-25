"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Wordmark } from "./Wordmark";
import { LocaleSwitcher } from "./LocaleSwitcher";

/** Public header — shown to visitors who are not signed in. */
export function SiteHeader() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keep the page behind a full-screen mobile menu from scrolling.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const links = [
    { href: `/${locale}#verticals`, label: t("inside") },
    { href: `/${locale}#process`, label: t("process") },
    { href: `/${locale}#philosophy`, label: t("philosophy") },
  ];

  return (
    <header
      /* Always solid white. It used to be transparent until scrolled, which
         left the nav floating over whatever the hero happened to be doing and
         made the links hard to read against the corner wash. Scrolling now only
         adds a shadow, so the bar lifts rather than appears. */
      className={`fixed inset-x-0 top-0 z-50 border-b border-line bg-paper transition-shadow duration-300 ${
        scrolled ? "shadow-[0_1px_16px_-6px_rgba(43,52,64,0.25)]" : ""
      }`}
    >
      <div className="mx-auto flex h-[74px] max-w-6xl items-center justify-between px-6 lg:px-8">
        <Wordmark href={`/${locale}`} />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}

          <LocaleSwitcher />

          <Link
            href={`/${locale}#apply`}
            className="btn btn-primary px-5 py-2 text-[12.5px]"
          >
            {t("joinNow")}
          </Link>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <LocaleSwitcher />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={t("menu")}
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-paper-soft text-ink"
          >
            {menuOpen ? (
              <X className="h-[18px] w-[18px]" strokeWidth={1.6} />
            ) : (
              <Menu className="h-[18px] w-[18px]" strokeWidth={1.6} />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-line bg-paper/97 px-6 pb-8 pt-6 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-[15px] text-ink-soft transition-colors hover:bg-paper-soft hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href={`/${locale}#apply`}
            onClick={() => setMenuOpen(false)}
            className="btn btn-primary mt-5 w-full py-3 text-[14px]"
          >
            {t("joinNow")}
          </Link>
        </div>
      )}
    </header>
  );
}
