import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Gift } from "lucide-react";
import { getApplication } from "@/lib/admin/queue";
import { DecisionPanel } from "@/components/admin/DecisionPanel";
import { ActivationLinkPanel } from "@/components/admin/ActivationLinkPanel";
import { isMailConfigured } from "@/lib/mail/mailer";
import type {
  MemberApplicationInput,
  PartnerApplicationInput,
} from "@/lib/domain";

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="border-b border-line py-3 last:border-0">
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-[14px] leading-[1.65] text-ink">
        {value}
      </dd>
    </div>
  );
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();

  const t = await getTranslations({ locale, namespace: "admin" });
  const tEnroll = await getTranslations({ locale, namespace: "enroll" });

  const isMember = application.type === "member";
  const member = isMember
    ? (application.data as MemberApplicationInput)
    : null;
  const partner = !isMember
    ? (application.data as PartnerApplicationInput)
    : null;

  return (
    <div>
      <Link
        href={`/${locale}/admin`}
        className="inline-flex items-center gap-2 text-[13px] text-ink-faint transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.6} />
        {t("detail.back")}
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] font-light text-ink">
            {application.displayName}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-ink-soft">
            <span>{t(`type.${application.type}`)}</span>
            <span className="text-ink-faint">·</span>
            <span>{t(`status.${application.status}`)}</span>
            <span className="text-ink-faint">·</span>
            <span>
              {t("detail.submitted", {
                date: new Date(application.createdAt).toLocaleString(locale),
              })}
            </span>
          </p>
        </div>

        {application.viaInvitation && (
          <span className="inline-flex items-center gap-2 rounded-full border border-aqua-500/30 bg-aqua-500/10 px-3.5 py-1.5 text-[12px] text-aqua-700">
            <Gift className="h-3.5 w-3.5" strokeWidth={1.6} />
            {application.grantedFreeMonths > 0
              ? t("detail.invitedWithMonths", {
                  months: application.grantedFreeMonths,
                })
              : t("detail.invitedReferral")}
          </span>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="glass-soft rounded-2xl px-6 py-5">
          <dl>
            <Row label={t("detail.email")} value={application.email} />
            <Row label={t("detail.phone")} value={application.phone} />

            {member && (
              <>
                <Row
                  label={tEnroll("member.dateOfBirth")}
                  value={member.dateOfBirth}
                />
                <Row
                  label={tEnroll("member.country")}
                  value={`${member.city}, ${member.country}`}
                />
                <Row
                  label={tEnroll("member.focusQuestion")}
                  value={member.focusAreas
                    .map((area) => tEnroll(`options.focus.${area}`))
                    .join(" · ")}
                />
                <Row
                  label={tEnroll("member.goalQuestion")}
                  value={tEnroll(`options.goal.${member.goal}`)}
                />
                <Row
                  label={tEnroll("member.horizonQuestion")}
                  value={tEnroll(`options.horizon.${member.horizon}`)}
                />
                <Row
                  label={tEnroll("member.referralQuestion")}
                  value={tEnroll(
                    `options.referralSource.${member.referralSource}`,
                  )}
                />
                <Row label={tEnroll("member.context")} value={member.context} />
              </>
            )}

            {partner && (
              <>
                <Row
                  label={tEnroll("partner.brandName")}
                  value={partner.brandName}
                />
                <Row
                  label={tEnroll("partner.categoryQuestion")}
                  value={tEnroll(`options.category.${partner.category}`)}
                />
                <Row
                  label={tEnroll("partner.teamSizeQuestion")}
                  value={partner.teamSize}
                />
                <Row
                  label={tEnroll("partner.street")}
                  value={`${partner.street}\n${partner.postalCode} ${partner.city}\n${partner.country}`}
                />
                <Row
                  label={tEnroll("partner.website")}
                  value={partner.website}
                />
                <Row
                  label={tEnroll("partner.ownerName")}
                  value={partner.ownerName}
                />
                <Row
                  label={tEnroll("partner.contactPersonName")}
                  value={partner.contactPersonName}
                />
                <Row
                  label={tEnroll("partner.serviceDescription")}
                  value={partner.serviceDescription}
                />
                <Row
                  label={tEnroll("partner.targetClientele")}
                  value={partner.targetClientele}
                />
                <Row
                  label={tEnroll("partner.expectations")}
                  value={partner.expectations}
                />
              </>
            )}

            {application.internalReason && (
              <Row
                label={t("detail.internalReason")}
                value={application.internalReason}
              />
            )}
          </dl>
        </div>

        <div>
          {application.status === "pending" ? (
            <DecisionPanel
              applicationId={application.id}
              type={application.type}
            />
          ) : (
            <div className="glass-soft rounded-2xl px-6 py-5">
              <p className="text-[14px] font-medium text-ink">
                {t(`detail.already.${application.status}`)}
              </p>
              {application.reviewedAt && (
                <p className="mt-1.5 text-[13px] text-ink-soft">
                  {t("detail.reviewedOn", {
                    date: new Date(application.reviewedAt).toLocaleString(locale),
                  })}
                </p>
              )}
              {application.partnerTier && (
                <p className="mt-3 text-[13px] text-ink-soft">
                  {t("detail.assignedTier", {
                    tier: t(`tier.${application.partnerTier}`),
                  })}
                </p>
              )}
            </div>
          )}

          {application.status === "approved" && !isMailConfigured() && (
            <ActivationLinkPanel applicationId={application.id} />
          )}
        </div>
      </div>
    </div>
  );
}
