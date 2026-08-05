import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { ResetPasswordForm } from "@/components/auth/PasswordResetForms";
import { isResetTokenValid } from "@/lib/auth/password-reset";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "resetPassword" });
  return { title: `${t("title")} — TheONE` };
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  const t = await getTranslations({ locale, namespace: "resetPassword" });

  const valid = token ? await isResetTokenValid(token) : false;

  return (
    <>
      <SiteHeader />
      <main className="grain relative flex-1 overflow-hidden pb-24 pt-[122px] sm:pt-[150px]">
        <div className="silk">
        </div>
        <div data-reveal className="relative mx-auto max-w-md px-6 lg:px-8">
          {valid && token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="glass edge-accent rounded-[26px] px-7 py-9 text-center sm:px-9">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-destructive/30 bg-destructive/10">
                <AlertTriangle
                  className="h-6 w-6 text-destructive"
                  strokeWidth={1.5}
                />
              </span>
              <h1 className="mt-6 font-display text-[24px] font-light text-ink">
                {t("invalidTitle")}
              </h1>
              <p className="mt-3 text-[13.5px] leading-[1.7] text-ink-soft">
                {t("invalidBody")}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
