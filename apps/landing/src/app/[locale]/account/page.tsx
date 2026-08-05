import type { Metadata } from "next";
import { ObjectId } from "mongodb";
import { getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { BillingPanel } from "@/components/account/BillingPanel";
import { ReferralPanel } from "@/components/account/ReferralPanel";
import { requireAccount } from "@/lib/auth/dal";
import { logout } from "@/app/actions/auth";
import { listInvitations } from "@/lib/admin/invitations";
import { freeMonthsForReferrals, planFor } from "@/lib/domain";
import { isTestActivationEnabled } from "@/lib/billing/testMode";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: `${t("title")} — TheONE` };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const account = await requireAccount(locale);
  const t = await getTranslations({ locale, namespace: "account" });

  const plan = planFor(account.role, account.partnerTier);
  const invitations = await listInvitations({
    inviterAccountId: new ObjectId(account.id),
    limit: 25,
  });

  const priceLabel = plan
    ? `€${(plan.amountCents / 100).toLocaleString("de-DE")}${
        plan.interval === "month" ? t("perMonth") : t("perYear")
      }`
    : null;

  return (
    <>
      <SiteHeader />
      <main className="grain relative flex-1 overflow-hidden pb-24 pt-[122px] sm:pt-[150px]">
        <div className="aurora" />

        <div className="relative mx-auto max-w-3xl px-6 lg:px-8">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="mt-4 font-display text-[34px] font-light text-ink sm:text-[40px]">
            {t("greeting", { name: account.firstName })}
          </h1>
          <p className="mt-2 text-[13.5px] text-ink-soft">
            {t("statusLine", {
              status: t(`statuses.${account.status}`),
              username: account.username,
            })}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <BillingPanel
              status={account.status}
              planLabel={plan?.label ?? null}
              priceLabel={priceLabel}
              freeMonths={account.freeMonthsGranted}
              hasCustomer={Boolean(account.stripeCustomerId)}
              testMode={isTestActivationEnabled()}
            />

            <ReferralPanel
              successfulReferrals={account.successfulReferrals}
              freeMonthsEarned={freeMonthsForReferrals(
                account.successfulReferrals,
              )}
              invitations={invitations}
              canInvite={account.status === "active"}
            />
          </div>

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
