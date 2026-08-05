import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BadgeCheck, Compass, Target } from "lucide-react";
import { MemberHeader } from "@/components/MemberHeader";
import { BenefitsSection } from "@/components/BenefitsSection";
import { ServicesSection } from "@/components/ServicesSection";
import { PillarsSection } from "@/components/PillarsSection";
import { Footer } from "@/components/Footer";
import { requireMember } from "@/lib/dal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: `${t("overview")} — TheONE` };
}

export default async function MembersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const member = await requireMember(locale);

  const t = await getTranslations({ locale, namespace: "members" });
  const tEnroll = await getTranslations({ locale, namespace: "enroll" });

  const memberSince = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(member.createdAt));

  const summary = [
    {
      icon: Target,
      label: t("yourGoal"),
      value: tEnroll(`options.goal.${member.answers.goal}`),
    },
    {
      icon: Compass,
      label: t("yourHorizon"),
      value: tEnroll(`options.horizon.${member.answers.horizon}`),
    },
  ];

  return (
    <>
      <MemberHeader name={member.fullName} />

      <main className="flex-1">
        <section className="grain relative overflow-hidden pb-16 pt-[126px] sm:pb-20 sm:pt-[150px]">
          <div className="aurora aurora--deep">
            <span className="aurora-bloom" />
          </div>

          <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
            <div data-reveal className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3.5 py-1.5">
                <BadgeCheck
                  className="h-3.5 w-3.5 text-teal-300"
                  strokeWidth={1.7}
                />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300">
                  {t("eyebrow")}
                </span>
              </span>
              <span className="rounded-full border border-gold-300/30 bg-gold-300/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-200">
                {member.role === "partner" ? t("rolePartner") : t("roleMember")}
              </span>
              <span className="text-[12px] text-mist-faint">
                {t("memberSince", { date: memberSince })}
              </span>
            </div>

            <h1
              data-reveal
              data-reveal-delay="80"
              className="mt-6 font-display text-[38px] font-light leading-[1.06] tracking-[-0.02em] text-mist sm:text-[52px]"
            >
              {t.rich("greeting", {
                name: member.firstName,
                accent: (chunks) => (
                  <span className="text-gradient-gold italic">{chunks}</span>
                ),
              })}
            </h1>

            <p
              data-reveal
              data-reveal-delay="140"
              className="mt-5 max-w-xl text-[15px] leading-[1.75] text-mist-dim"
            >
              {t("subtitle")}
            </p>

            {/* What they told us during enrolment */}
            <div
              data-reveal
              data-reveal-delay="200"
              className="mt-10 grid gap-3 sm:grid-cols-3"
            >
              <div className="glass-soft rounded-[20px] p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-mist-faint">
                  {t("yourFocus")}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {member.answers.focus.map((area) => (
                    <span
                      key={area}
                      className="rounded-full border border-gold-300/30 bg-gold-300/10 px-2.5 py-1 text-[11px] text-gold-200"
                    >
                      {tEnroll(`options.focus.${area}`)}
                    </span>
                  ))}
                </div>
              </div>

              {summary.map((item) => (
                <div key={item.label} className="glass-soft rounded-[20px] p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-mist-faint">
                    {item.label}
                  </p>
                  <p className="mt-3 flex items-start gap-2 text-[13.5px] leading-[1.6] text-mist">
                    <item.icon
                      className="mt-[3px] h-4 w-4 shrink-0 text-teal-300"
                      strokeWidth={1.5}
                    />
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ServicesSection highlight={member.answers.focus} />
        <BenefitsSection />
        <PillarsSection />
      </main>

      <Footer />
    </>
  );
}
