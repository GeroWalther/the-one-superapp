"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LogOut, Menu, X } from "lucide-react";
import { Wordmark } from "./Wordmark";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { logout } from "@/app/actions/auth";

/** Header for signed-in members — replaces the public one behind the gate. */
export function MemberHeader({ name }: { name: string }) {
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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const links = [
    { href: `/${locale}/members`, label: t("overview") },
    { href: `/${locale}/members#services`, label: t("services") },
    { href: `/${locale}/about`, label: t("about") },
  ];

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/8 bg-ink-900/85 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[74px] max-w-6xl items-center justify-between px-6 lg:px-8">
        <Wordmark href={`/${locale}/members`} />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] text-mist-dim transition-colors hover:text-mist"
            >
              {link.label}
            </Link>
          ))}

          <LocaleSwitcher />

          <span className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3.5">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-[11px] font-semibold text-ink-900">
              {initials}
            </span>
            <span className="text-[12.5px] text-mist">{name}</span>
          </span>

          <form action={logout}>
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className="flex items-center gap-1.5 text-[13px] text-mist-faint transition-colors hover:text-mist"
            >
              <LogOut className="h-[15px] w-[15px]" strokeWidth={1.6} />
              {t("logout")}
            </button>
          </form>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <LocaleSwitcher />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={t("menu")}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/5 text-mist"
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
        <div className="border-t border-white/8 bg-ink-900/97 px-6 pb-8 pt-6 backdrop-blur-xl md:hidden">
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-[12px] font-semibold text-ink-900">
              {initials}
            </span>
            <span className="text-[14px] text-mist">{name}</span>
          </div>

          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-[15px] text-mist-dim transition-colors hover:bg-white/5 hover:text-mist"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <form action={logout} className="mt-5">
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className="btn btn-ghost w-full py-3 text-[14px]">
              <LogOut className="h-4 w-4" strokeWidth={1.6} />
              {t("logout")}
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
