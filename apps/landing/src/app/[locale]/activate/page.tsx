import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AlertTriangle } from "lucide-react";
import { EnrollShell } from "@/components/enroll/EnrollShell";
import { ActivationForm } from "@/components/auth/ActivationForm";
import { inspectActivationToken } from "@/lib/auth/activation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "activate" });
  return { title: `${t("title")} — TheONE` };
}

export default async function ActivatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  const t = await getTranslations({ locale, namespace: "activate" });

  const target = token ? await inspectActivationToken(token) : null;

  if (!target || !token) {
    return (
      <EnrollShell eyebrow={t("eyebrow")} title={t("invalidTitle")}>
        <div className="glass edge-accent rounded-[26px] px-7 py-9 text-center sm:px-9">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-destructive/30 bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" strokeWidth={1.5} />
          </span>
          <p className="mt-6 text-[14px] leading-[1.7] text-ink-soft">
            {t("invalidBody")}
          </p>
        </div>
      </EnrollShell>
    );
  }

  return (
    <EnrollShell
      eyebrow={t("eyebrow")}
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <ActivationForm
        token={token}
        email={target.email}
        freeMonths={target.freeMonths}
      />
    </EnrollShell>
  );
}
