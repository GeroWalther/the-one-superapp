import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EnrollShell } from "@/components/enroll/EnrollShell";
import { ApplyChooser } from "@/components/ApplyChooser";
import { lookupInvitation } from "@/lib/applications/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "enroll" });
  return { title: `${t("chooser.title")} — TheONE` };
}

export default async function EnrollChooserPage({
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

  const inviteBanner = invitation
    ? invitation.kind === "admin"
      ? t("chooser.inviteAdmin", { months: invitation.grantsFreeMonths })
      : t("chooser.inviteReferral", {
          name: invitation.inviterName ?? t("chooser.aMember"),
        })
    : undefined;

  return (
    <EnrollShell
      eyebrow={t("chooser.eyebrow")}
      title={t("chooser.title")}
      subtitle={t("chooser.subtitle")}
      inviteBanner={inviteBanner}
      width="2xl"
    >
      {/* Same component as the landing page, so an invited applicant sees the
          identical form rather than a second, slightly different one. */}
      <ApplyChooser
        inviteCode={invitation && invite ? invite : undefined}
        restrictTo={invitation?.role}
      />
    </EnrollShell>
  );
}
