import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FileText } from "lucide-react";
import { EnrollShell } from "@/components/enroll/EnrollShell";
import { PartnerEnrollForm } from "@/components/enroll/PartnerEnrollForm";
import { lookupInvitation } from "@/lib/applications/service";
import { pageSeo } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "enroll" });
  return { title: `${t("partner.title")} | TheONE`, ...(await pageSeo(locale, "partner", "/enroll/partner")) };
}

export default async function PartnerEnrollPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const { locale } = await params;
  const { invite } = await searchParams;
  const t = await getTranslations({ locale, namespace: "enroll" });
  const tPreview = await getTranslations({ locale, namespace: "preview" });

  const invitation = invite ? await lookupInvitation(invite) : null;
  const validInvite = invitation?.role === "partner" ? invite : undefined;

  return (
    <EnrollShell
      eyebrow={t("partner.eyebrow")}
      title={t("partner.title")}
      subtitle={t("partner.subtitle")}
      inviteBanner={
        invitation?.role === "partner"
          ? invitation.kind === "admin"
            ? t("chooser.inviteAdmin", { months: invitation.grantsFreeMonths })
            : t("chooser.inviteReferral", {
                name: invitation.inviterName ?? t("chooser.aMember"),
              })
          : undefined
      }
      width="2xl"
    >
      {/* The brochure for a business that wants the whole story before it
          fills in the form; it opens in a new tab, so the form stays put. */}
      <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-[#1a626b]/15 bg-white/70 px-5 py-4">
        <p className="text-[15px] text-[#2f4744]">{tPreview("partnerPdfHint")}</p>
        <a
          href={`/business-information/TheONE-Business-Information-${locale === "de" ? "DE" : "EN"}.pdf`}
          target="_blank"
          rel="noopener"
          className="btn bg-gradient-to-br from-[#2e8f99] to-[#1a626b] px-5 py-2.5 text-[14.5px] font-semibold text-white shadow-[0_12px_28px_-14px_rgba(0,68,68,0.7)] hover:-translate-y-px"
        >
          <FileText className="h-4 w-4" strokeWidth={1.8} />
          {tPreview("viewBusinessInfo")}
        </a>
      </div>
      <PartnerEnrollForm inviteCode={validInvite} />
    </EnrollShell>
  );
}
