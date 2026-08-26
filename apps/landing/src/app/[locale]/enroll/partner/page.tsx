import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EnrollShell } from "@/components/enroll/EnrollShell";
import { EnrollIntro } from "@/components/enroll/EnrollIntro";
import { PartnerEnrollForm } from "@/components/enroll/PartnerEnrollForm";
import { lookupInvitation } from "@/lib/applications/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "enroll" });
  return { title: `${t("partner.title")} — TheONE` };
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
      <EnrollIntro audience="partner" />
      <PartnerEnrollForm inviteCode={validInvite} />
    </EnrollShell>
  );
}
