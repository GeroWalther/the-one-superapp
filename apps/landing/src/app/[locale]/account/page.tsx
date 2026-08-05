import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { requireAccount } from "@/lib/auth/dal";
import { logout } from "@/app/actions/auth";
import { PLANS, planFor } from "@/lib/domain";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: `${t("title")} — TheONE` };
}

/**
 * The signed-in account area. Billing, profile editing, and referral tools land
 * here in the payment phase; for now it reports status honestly rather than
 * pretending to offer actions that do not exist yet.
 */
export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const account = await requireAccount(locale);
  const t = await getTranslations({ locale, namespace: "account" });

  const plan = planFor(account.role, account.partnerTier);

  return (
    <>
      <SiteHeader />
      <main className="grain relative flex-1 overflow-hidden pb-24 pt-[122px] sm:pt-[150px]">
        <div className="aurora opacity-70" />

        <div className="relative mx-auto max-w-2xl px-6 lg:px-8">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="mt-4 font-display text-[34px] font-light text-mist sm:text-[40px]">
            {t("greeting", { name: account.firstName })}
          </h1>

          <div className="glass-soft mt-8 rounded-2xl px-6 py-5">
            <dl className="space-y-4">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.16em] text-mist-faint">
                  {t("status")}
                </dt>
                <dd className="mt-1 text-[15px] text-mist">
                  {t(`statuses.${account.status}`)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.16em] text-mist-faint">
                  {t("username")}
                </dt>
                <dd className="mt-1 text-[15px] text-mist">
                  {account.username}
                </dd>
              </div>
              {plan && (
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.16em] text-mist-faint">
                    {t("plan")}
                  </dt>
                  <dd className="mt-1 text-[15px] text-mist">
                    {plan.label} — €
                    {(plan.amountCents / 100).toLocaleString("de-DE")}
                    {plan.interval === "month"
                      ? t("perMonth")
                      : t("perYear")}
                  </dd>
                </div>
              )}
              {account.freeMonthsGranted > 0 && (
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.16em] text-mist-faint">
                    {t("freeMonths")}
                  </dt>
                  <dd className="mt-1 text-[15px] text-gold-200">
                    {t("freeMonthsValue", { months: account.freeMonthsGranted })}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {account.status === "awaiting_payment" && (
            <p className="mt-4 rounded-2xl border border-gold-300/30 bg-gold-300/10 px-5 py-4 text-[13.5px] leading-[1.7] text-gold-200">
              {t("awaitingPaymentNote", {
                price: (PLANS.member.amountCents / 100).toString(),
              })}
            </p>
          )}

          <form action={logout} className="mt-8">
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className="btn btn-ghost px-6 py-2.5 text-[14px]">
              <LogOut className="h-4 w-4" strokeWidth={1.6} />
              {t("signOut")}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
