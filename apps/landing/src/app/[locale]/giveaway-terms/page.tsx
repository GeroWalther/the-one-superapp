import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { legalDoc } from "@/content/legal";
import { pageSeo } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: `${legalDoc("giveawayTerms", locale).title} | TheONE`, ...(await pageSeo(locale, "giveaway", "/giveaway-terms")) };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPage doc={legalDoc("giveawayTerms", locale)} locale={locale} />;
}
