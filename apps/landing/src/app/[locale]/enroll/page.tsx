import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Building2, UserRound } from "lucide-react";
import { EnrollShell } from "@/components/enroll/EnrollShell";
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
  const query = invitation && invite ? `?invite=${encodeURIComponent(invite)}` : "";

  const inviteBanner = invitation
    ? invitation.kind === "admin"
      ? t("chooser.inviteAdmin", { months: invitation.grantsFreeMonths })
      : t("chooser.inviteReferral", {
          name: invitation.inviterName ?? t("chooser.aMember"),
        })
    : undefined;

  /* An invitation is issued for one role, so offering the other would only lead
     to a rejected submission at the end of a long form. */
  const paths = (
    [
      {
        role: "member" as const,
        href: `/${locale}/enroll/member${query}`,
        icon: UserRound,
        title: t("chooser.memberTitle"),
        desc: t("chooser.memberDesc"),
        meta: t("chooser.memberMeta"),
      },
      {
        role: "partner" as const,
        href: `/${locale}/enroll/partner${query}`,
        icon: Building2,
        title: t("chooser.partnerTitle"),
        desc: t("chooser.partnerDesc"),
        meta: t("chooser.partnerMeta"),
      },
    ] as const
  ).filter((path) => !invitation || invitation.role === path.role);

  return (
    <EnrollShell
      eyebrow={t("chooser.eyebrow")}
      title={t("chooser.title")}
      subtitle={t("chooser.subtitle")}
      inviteBanner={inviteBanner}
      width="2xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {paths.map((path) => (
          <Link
            key={path.role}
            href={path.href}
            className="glass-soft lift group flex flex-col rounded-[22px] p-7"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full border border-gold-300/25 bg-gold-300/10">
              <path.icon className="h-5 w-5 text-gold-300" strokeWidth={1.4} />
            </span>
            <h2 className="mt-5 font-display text-[22px] font-medium text-mist">
              {path.title}
            </h2>
            <p className="mt-2.5 flex-1 text-[13.5px] leading-[1.7] text-mist-dim">
              {path.desc}
            </p>
            <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-mist-faint">
              {path.meta}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-[13.5px] font-medium text-gold-300">
              {t("chooser.start")}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={1.8}
              />
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-[12.5px] leading-[1.7] text-mist-faint">
        {t("chooser.process")}
      </p>
    </EnrollShell>
  );
}
