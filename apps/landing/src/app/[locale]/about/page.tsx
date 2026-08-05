import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage" });
  return { title: `${t("title")} — TheONE` };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage" });
  const tEnroll = await getTranslations({ locale, namespace: "enroll" });

  return (
    <>
      <SiteHeader />

      <main className="grain relative flex-1 overflow-hidden pb-24 pt-[126px] sm:pt-[150px]">
        <div className="aurora opacity-70" />

        <section className="relative mx-auto max-w-3xl px-6 lg:px-8">
          <div data-reveal>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="mt-4 font-display text-[38px] font-light leading-[1.08] text-mist sm:text-[50px]">
              {t("title")}
            </h1>
            <p className="mt-4 text-[15px] italic text-gold-300/85">
              {t("tagline")}
            </p>
            <hr className="rule-gold mt-8 w-full max-w-xs" />
          </div>

          <div
            data-reveal
            data-reveal-delay="100"
            className="mt-10 space-y-6 text-[15px] leading-[1.85] text-mist-dim"
          >
            <p className="text-[16.5px] leading-[1.8] text-mist">{t("intro")}</p>
            <p>{t("mission")}</p>
            <p>{t("philosophy")}</p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            <article data-reveal className="glass-soft lift rounded-[22px] p-7">
              <h2 className="font-display text-[23px] font-medium text-mist">
                {t("partnersTitle")}
              </h2>
              <p className="mt-3 text-[13.5px] leading-[1.8] text-mist-dim">
                {t("partnersBody")}
              </p>
            </article>

            <article
              data-reveal
              data-reveal-delay="110"
              className="glass-soft lift rounded-[22px] p-7"
            >
              <h2 className="font-display text-[23px] font-medium text-mist">
                {t("approachTitle")}
              </h2>
              <p className="mt-3 text-[13.5px] leading-[1.8] text-mist-dim">
                {t("approachBody")}
              </p>
            </article>
          </div>

          <div data-reveal className="mt-14 text-center">
            <Link
              href={`/${locale}/enroll`}
              className="btn btn-gold px-7 py-3 text-[15px]"
            >
              {tEnroll("chooser.title")}
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
