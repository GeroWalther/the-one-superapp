import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

/**
 * What this audience gets, and what happens after they submit — shown above the
 * form on each application page.
 *
 * The landing page's cards are a summary that has to fit beside its twin; this
 * is the same argument with room to make it, so someone arriving from either
 * card lands on a page that answers "what do I get, what does it cost, what
 * happens next" before it asks for their details.
 *
 * The four steps matter more than they look: this funnel is unusual — you apply,
 * wait for a human decision, then pay. Someone who does not know that reads the
 * form as a checkout and is surprised twice.
 */
export function EnrollIntro({ audience }: { audience: "member" | "partner" }) {
  const t = useTranslations("audience");
  const tProcess = useTranslations("process");

  const points =
    audience === "member"
      ? [
          { title: t("memberPoint1"), desc: t("memberPoint1Desc") },
          { title: t("memberPoint2"), desc: t("memberPoint2Desc") },
          { title: t("memberPoint3"), desc: t("memberPoint3Desc") },
        ]
      : [
          { title: t("partnerPoint1"), desc: t("partnerPoint1Desc") },
          { title: t("partnerPoint2"), desc: t("partnerPoint2Desc") },
          { title: t("partnerPoint3"), desc: t("partnerPoint3Desc") },
        ];

  const price = audience === "member" ? t("memberPrice") : t("partnerPrice");
  const unit =
    audience === "member" ? t("memberPriceUnit") : t("partnerPriceUnit");
  const note =
    audience === "member" ? t("memberPriceNote") : t("partnerPriceNote");

  const steps = [
    tProcess("step1Title"),
    tProcess("step2Title"),
    tProcess("step3Title"),
    tProcess("step4Title"),
  ];

  return (
    <div data-reveal data-reveal-delay="60" className="mb-12">
      <ul className="grid gap-6 sm:grid-cols-3">
        {points.map((point) => (
          <li key={point.title}>
            <Check className="h-4 w-4 text-aqua-500" strokeWidth={2.2} />
            <p className="mt-3 text-[14px] font-semibold text-ink">
              {point.title}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-[1.7] text-ink-soft">
              {point.desc}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-y border-line py-6">
        <p className="flex items-baseline gap-2">
          <span className="font-display text-[30px] font-light leading-none text-ink">
            {price}
          </span>
          <span className="text-[13.5px] text-ink-soft">{unit}</span>
        </p>
        <p className="max-w-xs text-[12.5px] leading-[1.6] text-ink-faint">
          {note}
        </p>
      </div>

      {/* The order of events, stated before the form rather than after it. */}
      <ol className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-3">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-3">
            <span className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full border border-aqua-200 font-display text-[11px] text-aqua-600">
                {index + 1}
              </span>
              <span className="text-[12.5px] text-ink-soft">{step}</span>
            </span>
            {index < steps.length - 1 && (
              <span aria-hidden="true" className="text-ink-faint">
                ·
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
