import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LayoutGrid, LogOut, Mail } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { logout } from "@/app/actions/auth";

/**
 * Admin chrome. Denser and plainer than the marketing site — this is a working
 * tool, not a shop window.
 *
 * `requireAdmin` runs here, but every admin server action re-checks the role
 * independently: a layout guard protects navigation, not endpoints.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const account = await requireAdmin(locale);
  const t = await getTranslations({ locale, namespace: "admin" });

  const links = [
    { href: `/${locale}/admin`, label: t("nav.queue"), icon: LayoutGrid },
    {
      href: `/${locale}/admin/invitations`,
      label: t("nav.invitations"),
      icon: Mail,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-ink-900">
      <header className="border-b border-white/8 bg-ink-800/60 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 lg:px-8">
          <div className="flex items-center gap-6">
            <Link
              href={`/${locale}/admin`}
              className="font-display text-[17px] leading-none text-mist"
            >
              <span className="font-light">The</span>
              <span className="text-gradient-gold font-semibold">ONE</span>
              <span className="ml-2 text-[11px] uppercase tracking-[0.2em] text-mist-faint">
                {t("nav.badge")}
              </span>
            </Link>

            <nav className="hidden items-center gap-1 sm:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] text-mist-dim transition-colors hover:bg-white/5 hover:text-mist"
                >
                  <link.icon className="h-4 w-4" strokeWidth={1.6} />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-[12.5px] text-mist-faint sm:inline">
              {account.email}
            </span>
            <form action={logout}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="flex items-center gap-1.5 text-[13px] text-mist-faint transition-colors hover:text-mist"
              >
                <LogOut className="h-[15px] w-[15px]" strokeWidth={1.6} />
                {t("nav.signOut")}
              </button>
            </form>
          </div>
        </div>

        <nav className="flex items-center gap-1 border-t border-white/8 px-5 py-2 sm:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] text-mist-dim"
            >
              <link.icon className="h-4 w-4" strokeWidth={1.6} />
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1 px-5 py-8 lg:px-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
