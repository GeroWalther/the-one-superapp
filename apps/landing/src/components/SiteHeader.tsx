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

  return (
    <header
      /* Fully transparent at the top so the hero runs edge to edge, solid once
         scrolled so the links keep a ground as content passes under.
         Known cost: at the top the nav sits exactly where the hero crosses from
         pale to the dark corner, so no single link colour clears 4.5:1 along
         its whole width — "Philosophie" measures 1.01:1 against the dark end.
         Chosen deliberately over a translucent bar. */
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-transparent bg-[#eef3f3] shadow-[0_1px_14px_-8px_rgba(43,52,64,0.18)]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[74px] max-w-6xl items-center justify-between px-6 lg:px-8">
        <Wordmark href={`/${locale}`} />

        <nav className="hidden items-center gap-8 md:flex">
          <LocaleSwitcher />

          <Link
            href={`/${locale}#apply`}
            className="btn btn-primary px-5 py-2 text-[15px]"
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
        <div className="border-t border-line bg-[#eef3f3] px-6 pb-8 pt-6 md:hidden">

          <Link
            href={`/${locale}#apply`}
            onClick={() => setMenuOpen(false)}
            className="btn btn-primary w-full py-3 text-[15px]"
          >
            {t("joinNow")}
          </Link>
        </div>
      )}
    </header>
  );
}
