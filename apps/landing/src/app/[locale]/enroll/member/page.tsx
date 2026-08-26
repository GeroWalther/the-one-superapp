import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EnrollShell } from "@/components/enroll/EnrollShell";
import { EnrollIntro } from "@/components/enroll/EnrollIntro";
import { MemberEnrollForm } from "@/components/enroll/MemberEnrollForm";
import { lookupInvitation } from "@/lib/applications/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "enroll" });
  return { title: `${t("member.title")} — TheONE` };
}

export default async function MemberEnrollPage({
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
  const validInvite = invitation?.role === "member" ? invite : undefined;

  return (
    <EnrollShell
      eyebrow={t("member.eyebrow")}
      title={t("member.title")}
      subtitle={t("member.subtitle")}
      inviteBanner={
        invitation?.role === "member"
          ? invitation.kind === "admin"
            ? t("chooser.inviteAdmin", { months: invitation.grantsFreeMonths })
            : t("chooser.inviteReferral", {
                name: invitation.inviterName ?? t("chooser.aMember"),
              })
          : undefined
      }
      width="2xl"
    >
      <EnrollIntro audience="member" />
      <MemberEnrollForm inviteCode={validInvite} />
    </EnrollShell>
  );
}
