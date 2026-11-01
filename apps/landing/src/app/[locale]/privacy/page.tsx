import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { legalDoc } from "@/content/legal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: `${legalDoc("privacy", locale).title} — TheONE` };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPage doc={legalDoc("privacy", locale)} locale={locale} />;
}
