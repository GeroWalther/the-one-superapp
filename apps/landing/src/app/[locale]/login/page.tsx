import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentMember } from "@/lib/dal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });
  return { title: `${t("title")} — TheONE` };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const member = await getCurrentMember();

  if (member) {
    redirect(`/${locale}/members`);
  }

  return (
    <>
      <SiteHeader />
      <main className="grain relative flex-1 overflow-hidden pb-24 pt-[122px] sm:pt-[150px]">
        <div className="aurora aurora--deep opacity-80">
          <span className="aurora-bloom" />
        </div>

        <div
          data-reveal
          className="relative mx-auto max-w-md px-6 lg:px-8"
        >
          <LoginForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
