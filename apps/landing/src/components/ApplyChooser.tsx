import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Building2, UserRound } from "lucide-react";

type Choice = "member" | "partner";

/**
 * Picks which application to open.
 *
 * It hands off to a dedicated page per audience rather than swapping a form in
 * beneath itself. Those pages carry what that side gets and what it costs, so
 * whichever route someone arrives by, they read the argument that applies to
 * them before the form asks for anything.
 *
 * Stateless as a result, and no longer a client component — an invitation is
 * handled by the caller passing `restrictTo`, since an invitation is issued for
 * one role and offering the other only leads to a rejection at the end of a
 * long form.
 */
export function ApplyChooser({
  inviteCode,
  restrictTo,
}: {
  inviteCode?: string;
  restrictTo?: Choice;
}) {
  const t = useTranslations("enroll");
  const locale = useLocale();

  const query = inviteCode ? `?invite=${encodeURIComponent(inviteCode)}` : "";

  const paths = (
    [
      {
        role: "member" as const,
        icon: UserRound,
        title: t("chooser.memberTitle"),
        desc: t("chooser.memberDesc"),
      },
      {
        role: "partner" as const,
        icon: Building2,
        title: t("chooser.partnerTitle"),
        desc: t("chooser.partnerDesc"),
      },
    ] as const
  ).filter((path) => !restrictTo || path.role === restrictTo);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {paths.map((path) => (
          <Link
            key={path.role}
            href={`/${locale}/enroll/${path.role}${query}`}
            className="card-brand-soft group flex flex-col p-7 text-left"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full border border-aqua-500/25 bg-aqua-500/10">
              <path.icon className="h-5 w-5 text-aqua-500" strokeWidth={1.4} />
            </span>
            <h3 className="mt-5 font-display text-[22px] font-medium text-ink">
              {path.title}
            </h3>
            <p className="mt-2.5 flex-1 text-[13.5px] leading-[1.7] text-ink-soft">
              {path.desc}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-[13.5px] font-medium text-aqua-600">
              {t("chooser.start")}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={1.8}
              />
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-7 text-center text-[12.5px] leading-[1.7] text-ink-faint">
        {t("chooser.process")}
      </p>
    </div>
  );
}
