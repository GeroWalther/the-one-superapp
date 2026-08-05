import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { ForgotPasswordForm } from "@/components/auth/PasswordResetForms";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "forgotPassword" });
  return { title: `${t("title")} — TheONE` };
}

export default async function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="grain relative flex-1 overflow-hidden pb-24 pt-[122px] sm:pt-[150px]">
        <div className="aurora aurora--deep opacity-80">
          <span className="aurora-bloom" />
        </div>
        <div data-reveal className="relative mx-auto max-w-md px-6 lg:px-8">
          <ForgotPasswordForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
