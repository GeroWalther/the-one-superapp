"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Building2, UserRound } from "lucide-react";
import { MemberEnrollForm } from "@/components/enroll/MemberEnrollForm";
import { PartnerEnrollForm } from "@/components/enroll/PartnerEnrollForm";

type Choice = "member" | "partner";

/**
 * Choose a path, then apply — without leaving the page.
 *
 * Sending a visitor to /enroll only to ask "which are you?" spends a page load
 * on a question, and a member who picks wrong has to navigate back. Holding the
 * choice in state here means picking is instant and reversible, and the form
 * they land in is already the right one.
 */
export function ApplyChooser({
  inviteCode,
  restrictTo,
}: {
  inviteCode?: string;
  /** An invitation is issued for one role; offering the other only leads to a
      rejection at the end of a long form. */
  restrictTo?: Choice;
}) {
  const t = useTranslations("enroll");
  const [choice, setChoice] = useState<Choice | null>(restrictTo ?? null);
  const formRef = useRef<HTMLDivElement>(null);

  /* The form is taller than the chooser it replaces, so without this the
     visitor is left looking at whatever was below it. Skipped on first render —
     scrolling a page nobody has interacted with is disorienting. */
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (choice) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [choice]);

  const paths = ([
    {
      role: "member" as const,
      icon: UserRound,
      title: t("chooser.memberTitle"),
      desc: t("chooser.memberDesc"),
      meta: t("chooser.memberMeta"),
    },
    {
      role: "partner" as const,
      icon: Building2,
      title: t("chooser.partnerTitle"),
      desc: t("chooser.partnerDesc"),
      meta: t("chooser.partnerMeta"),
    },
  ] as const).filter((path) => !restrictTo || path.role === restrictTo);

  if (choice) {
    return (
      <div ref={formRef} className="scroll-mt-28">
        {!restrictTo && (
          <button
            type="button"
            onClick={() => setChoice(null)}
            className="mb-5 inline-flex items-center gap-2 text-[13px] text-ink-faint transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.6} />
            {t("chooser.back")}
          </button>
        )}

        {choice === "member" ? (
          <MemberEnrollForm inviteCode={inviteCode} />
        ) : (
          <PartnerEnrollForm inviteCode={inviteCode} />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {paths.map((path) => (
          <button
            key={path.role}
            type="button"
            onClick={() => setChoice(path.role)}
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
            <span className="mt-4 text-[11px] uppercase tracking-[0.16em] text-ink-faint">
              {path.meta}
            </span>
            <span className="mt-5 inline-flex items-center gap-2 text-[13.5px] font-medium text-aqua-600">
              {t("chooser.start")}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={1.8}
              />
            </span>
          </button>
        ))}
      </div>

      <p className="mt-7 text-center text-[12.5px] leading-[1.7] text-ink-faint">
        {t("chooser.process")}
      </p>
    </div>
  );
}
