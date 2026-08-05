import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, Mail } from "lucide-react";
import { EnrollShell } from "@/components/enroll/EnrollShell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "enroll" });
  return { title: `${t("submitted.receivedTitle")} — TheONE` };
}

export default async function SubmittedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ state?: string }>;
}) {
  const { locale } = await params;
  const { state } = await searchParams;
  const t = await getTranslations({ locale, namespace: "enroll" });

  /* An admin-invited applicant is approved on submit, so telling them to wait
     for a review that already happened would be wrong. */
  const approved = state === "approved";

  const steps = approved
    ? [t("submitted.approvedStep1"), t("submitted.approvedStep2")]
    : [
        t("submitted.receivedStep1"),
        t("submitted.receivedStep2"),
        t("submitted.receivedStep3"),
      ];

  return (
    <EnrollShell
      eyebrow={t("submitted.eyebrow")}
      title={approved ? t("submitted.approvedTitle") : t("submitted.receivedTitle")}
      subtitle={approved ? t("submitted.approvedBody") : t("submitted.receivedBody")}
    >
      <div className="glass edge-gold rounded-[26px] px-7 py-9 text-center sm:px-9">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold-300/30 bg-gold-300/10">
          {approved ? (
            <CheckCircle2 className="h-6 w-6 text-gold-300" strokeWidth={1.5} />
          ) : (
            <Mail className="h-6 w-6 text-gold-300" strokeWidth={1.5} />
          )}
        </span>

        <ol className="mx-auto mt-8 max-w-sm space-y-4 text-left">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3">
              <span className="mt-[1px] grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-[11px] font-semibold text-gold-300">
                {index + 1}
              </span>
              <span className="text-[13.5px] leading-[1.65] text-mist-dim">
                {step}
              </span>
            </li>
          ))}
        </ol>

        <hr className="rule-gold mx-auto my-8 w-full max-w-xs" />

        <p className="text-[12.5px] leading-[1.7] text-mist-faint">
          {t("submitted.spamNote")}
        </p>

        <Link
          href={`/${locale}`}
          className="btn btn-ghost mt-7 px-6 py-2.5 text-[14px]"
        >
          {t("submitted.backHome")}
        </Link>
      </div>
    </EnrollShell>
  );
}
