import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { EnrollForm } from "@/components/EnrollForm";
import { getCurrentMember } from "@/lib/dal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "enroll" });
  return { title: `${t("title")} — TheONE` };
}

export default async function EnrollPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const member = await getCurrentMember();

  if (member) {
    redirect(`/${locale}/members`);
  }

  const t = await getTranslations({ locale, namespace: "enroll" });

  return (
    <>
      <SiteHeader />
      <main className="grain relative flex-1 overflow-hidden pb-24 pt-[122px] sm:pt-[140px]">
        <div className="aurora aurora--deep opacity-80">
          <span className="aurora-bloom" />
        </div>

        <div className="relative mx-auto max-w-xl px-6 lg:px-8">
          <div data-reveal className="text-center">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="mt-4 font-display text-[36px] font-light leading-tight text-mist sm:text-[44px]">
              {t("title")}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-[1.75] text-mist-dim">
              {t("subtitle")}
            </p>
          </div>

          <div data-reveal data-reveal-delay="120" className="mt-10">
            <EnrollForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
