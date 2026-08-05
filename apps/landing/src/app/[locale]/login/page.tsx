import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentAccount } from "@/lib/auth/dal";

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
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;

  const account = await getCurrentAccount();
  if (account) {
    redirect(account.role === "admin" ? `/${locale}/admin` : `/${locale}/account`);
  }

  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <>
      <SiteHeader />
      <main className="grain relative flex-1 overflow-hidden pb-24 pt-[122px] sm:pt-[150px]">
        <div className="silk">
        </div>
        <div data-reveal className="relative mx-auto max-w-md px-6 lg:px-8">
          <LoginForm next={safeNext} />
        </div>
      </main>
      <Footer />
    </>
  );
}
