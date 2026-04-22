import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getTranslations } from "next-intl/server";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage" });

  return (
    <>
      <Header />
      <main className="flex-1 pt-32 sm:pt-40">
        <section className="mx-auto max-w-3xl px-6 pb-20 lg:px-8">
          <h1 className="font-display text-[36px] font-bold leading-[1.1] text-[#1a1a2e] sm:text-[48px]">
            {t("title")}
          </h1>
          <p className="mt-4 text-[15px] italic text-[#8a8a8a] sm:text-[16px]">
            {t("tagline")}
          </p>

          <div className="mt-10 space-y-6 text-[15px] leading-[1.8] text-[#333]">
            <p>{t("intro")}</p>
            <p>{t("mission")}</p>
            <p>{t("philosophy")}</p>
          </div>

          <h2 className="mt-14 font-display text-[24px] font-semibold text-[#1a1a2e] sm:text-[28px]">
            {t("partnersTitle")}
          </h2>
          <p className="mt-3 text-[14px] leading-[1.8] text-[#555]">
            {t("partnersBody")}
          </p>

          <h2 className="mt-14 font-display text-[24px] font-semibold text-[#1a1a2e] sm:text-[28px]">
            {t("approachTitle")}
          </h2>
          <p className="mt-3 text-[14px] leading-[1.8] text-[#555]">
            {t("approachBody")}
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
