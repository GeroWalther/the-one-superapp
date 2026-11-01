import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight, Building2, Compass, MessagesSquare, Sparkles } from "lucide-react";

/**
 * "What is TheONE SUPER APP" — the section that tells the whole story, for a
 * member and then for a partner business.
 *
 * Dark, and full-bleed, for two reasons. The page runs pale from the masthead
 * down, so this is the one place the eye gets a hard stop; and the claim is
 * *infrastructure*, which reads better on something that looks built than on
 * the same near-white ground as everything around it. It also answers the
 * storm above — same petrol, inverted.
 *
 * The copy is long, so the section is built as five movements with different
 * shapes rather than one column of paragraphs: a centred lead, three beats
 * hung off a vertical spine, a brand rest, a partner half set as a panel, and
 * a closing claim. The shape changing is what keeps a long read from feeling
 * like a wall.
 */

const PETROL = {
  ground: "#00252a",
  deep: "#003b40",
  line: "#0d5058",
};

const GOLD = "#e6b849";

export function WhatIsSection() {
  const t = useTranslations("preview.about");
  const tPreview = useTranslations("preview");

  /* The three beats, in the order the copy makes them: the AI matches, then
     understands, then connects. Each is a node on the spine. */
  const beats = [
    {
      index: "01",
      icon: Compass,
      title: t("matchTitle"),
      body: [t("matchBody1")],
    },
    {
      index: "02",
      icon: MessagesSquare,
      title: t("understandTitle"),
      body: [t("understandBody1"), t("understandBody2")],
    },
    {
      index: "03",
      icon: Sparkles,
      title: t("connectTitle"),
      body: [t("connectBody1"), t("connectBody2")],
    },
  ];

  const partnerBody = [
    t("partner1"),
    t("partner2"),
    t("partner3"),
    t("partner4"),
  ];

  return (
    <section
      /* left-1/2 + w-screen + -translate-x-1/2 breaks this out of the column
         the preview page lays everything else in. */
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-x-clip py-20 sm:py-28"
      style={{
        background: `radial-gradient(ellipse 80% 55% at 50% 0%, ${PETROL.deep} 0%, ${PETROL.ground} 52%, #001416 100%)`,
      }}
    >
      {/* A fine grid, masked to a soft ellipse: structure you can feel rather
          than read. Aqua, not grey — on a dark ground a grey grid reads as
          noise and a tinted one reads as engineering. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `linear-gradient(rgba(79,179,191,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(79,179,191,.14) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 78% 60% at 50% 30%, #000 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 78% 60% at 50% 30%, #000 20%, transparent 75%)",
        }}
      />
      {/* Gold wash off the top edge, picking up the storm that sits above. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{
          background:
            "linear-gradient(180deg, rgba(184,145,74,0.16) 0%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
        {/* --- 1. the lead ------------------------------------------------ */}
        <div className="text-center">
          <h2
            data-reveal
            className="mx-auto max-w-3xl text-balance font-display text-[30px] font-light leading-[1.2] text-white sm:text-[42px] lg:text-[48px]"
          >
            {t("title")}
          </h2>
          <p
            data-reveal
            data-reveal-delay="100"
            className="mx-auto mt-8 max-w-2xl text-pretty text-[15.5px] leading-[1.8] text-aqua-200/80 sm:text-[17px]"
          >
            {t("lead1")}
          </p>
          <p
            data-reveal
            data-reveal-delay="160"
            className="mx-auto mt-5 max-w-2xl text-pretty text-[15.5px] leading-[1.8] text-aqua-200/80 sm:text-[17px]"
          >
            {t("lead2")}
          </p>
        </div>

        {/* --- 2. the three beats, hung off a spine ----------------------- */}
        <div className="relative mt-20 sm:mt-24">
          {/* The spine runs the height of the beats, behind the nodes. Its
              ends fade so it reads as a continuing line rather than a rule
              with two hard stops. */}
          <div
            aria-hidden="true"
            className="absolute bottom-8 left-[19px] top-8 w-px sm:left-[27px]"
            style={{
              background: `linear-gradient(180deg, transparent, ${PETROL.line} 8%, ${PETROL.line} 92%, transparent)`,
            }}
          />

          <ol className="space-y-14 sm:space-y-16">
            {beats.map((beat, i) => (
              <li
                key={beat.index}
                data-reveal
                data-reveal-delay={`${120 + i * 90}`}
                className="relative flex gap-6 sm:gap-9"
              >
                {/* The node, sitting on the spine. Its pulse is delayed a
                    third of the loop each, so the three light in sequence
                    rather than together. */}
                <span
                  className="wt-node relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border sm:h-14 sm:w-14"
                  style={{
                    animationDelay: `${i * 2.4}s`,
                    borderColor: "rgba(79,179,191,0.45)",
                    background: `radial-gradient(circle at 40% 35%, ${PETROL.deep}, ${PETROL.ground})`,
                  }}
                >
                  <beat.icon
                    className="h-4 w-4 text-aqua-400 sm:h-5 sm:w-5"
                    strokeWidth={1.4}
                  />
                </span>

                <div className="flex-1 pt-0.5 sm:pt-2">
                  <span className="text-[10.5px] uppercase tracking-[0.3em] text-aqua-400/60">
                    {beat.index}
                  </span>
                  <h3 className="mt-2 text-balance font-display text-[21px] font-light leading-[1.3] text-white sm:text-[27px]">
                    {beat.title}
                  </h3>
                  {beat.body.map((line) => (
                    <p
                      key={line}
                      className="mt-4 max-w-2xl text-pretty text-[15px] leading-[1.8] text-aqua-200/75 sm:text-[16px]"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* --- 3. the brand rest ----------------------------------------- */}
        <div
          data-reveal
          className="mt-24 border-y py-14 text-center sm:mt-28 sm:py-16"
          style={{ borderColor: "rgba(13,80,88,0.7)" }}
        >
          <p className="font-display text-[26px] font-light leading-none text-white sm:text-[32px]">
            {t("brandName")}
          </p>
          <p
            className="mt-4 font-display text-[22px] font-bold tracking-[0.14em] sm:text-[30px]"
            style={{ color: GOLD }}
          >
            {t("brandClaim")}
          </p>
          <p className="mx-auto mt-7 max-w-xl text-pretty text-[15px] leading-[1.8] text-aqua-200/75 sm:text-[16px]">
            {t("brandBody")}
          </p>
        </div>

        {/* --- 4. the partner half --------------------------------------- */}
        {/* Set as a panel rather than more centred copy: this half is
            addressed to businesses, and the reader needs to see that before
            they start reading it. */}
        {/* Light, in the phone mockup's colours (the page's #eef3f3 ground, a
            petrol wash from the top, the background ribbons), so the business
            pitch stands out of the dark section as its own card. */}
        <div
          data-reveal
          className="relative mt-24 overflow-hidden rounded-3xl border border-white/40 p-8 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.6)] sm:mt-28 sm:p-12 lg:p-14"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,82,82,0.3) 0%, rgba(0,82,82,0.14) 24%, rgba(0,82,82,0) 48%), #eef3f3",
          }}
        >
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 1000 800"
          >
            <defs>
              <linearGradient id="wi-ribbon" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="55%" stopColor="#85acac" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#d6e3e3" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {[0, 110, 220].map((offset) => (
              <path
                key={offset}
                d={`M-80,${330 + offset} C 260,${150 + offset} 640,${520 + offset} 1080,${240 + offset}`}
                fill="none"
                stroke="url(#wi-ribbon)"
                strokeWidth={110}
                opacity={0.5}
              />
            ))}
          </svg>

          <div className="relative">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#1a626b] to-[#00353b] shadow-[0_6px_14px_-6px_rgba(0,37,42,0.55)]">
              <Building2 className="h-5 w-5 text-white" strokeWidth={1.6} />
            </span>

            <h3 className="mt-7 text-balance font-display text-[26px] font-semibold leading-[1.25] text-[#000f11] sm:text-[36px]">
              {t("partnerTitle")}
            </h3>
            <p className="mt-4 text-[16px] font-semibold text-[#005252] sm:text-[17px]">
              {t("partnerLead")}
            </p>

            {/* Capped at the file's own 585px width: the source is small and
                stretching it any wider turned it soft. Swap in a larger file
                at the same path to let it grow. */}
            <Image
              src="/images/business-partners.jpg"
              alt="Saudi Polo Ladies Tournament and Polo & Lifestyle, The London Magazine"
              width={585}
              height={309}
              unoptimized
              className="mt-8 h-auto w-full max-w-[585px] rounded-2xl shadow-[0_18px_40px_-20px_rgba(0,37,42,0.55)] ring-1 ring-[#005252]/10"
            />

            {/* Two columns from lg, so the four paragraphs read as two pairs. */}
            <div className="mt-8 gap-x-12 text-[15px] leading-[1.8] text-[#37414d] sm:text-[16px] lg:columns-2">
              {partnerBody.map((line) => (
                <p key={line} className="mb-5 break-inside-avoid text-pretty">
                  {line}
                </p>
              ))}
            </div>

            {/* The copy ends on "apply now", so the panel ends on the way to
                do it: straight into the partner form in the apply section. */}
            <a
              href="#apply-partner"
              className="btn mt-4 bg-gradient-to-br from-[#1a626b] to-[#00353b] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_28px_-14px_rgba(0,37,42,0.8)] hover:-translate-y-px"
            >
              {tPreview("becomePartner")}
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </a>
          </div>
        </div>

        {/* --- 5. the closing claim -------------------------------------- */}
        <div data-reveal className="mt-24 text-center sm:mt-28">
          <p className="mx-auto max-w-2xl text-pretty text-[15.5px] leading-[1.8] text-aqua-200/80 sm:text-[17px]">
            {t("closeBody")}
          </p>
          <p
            className="mt-8 text-balance font-display text-[26px] font-bold tracking-[0.12em] sm:text-[40px]"
            style={{ color: GOLD }}
          >
            {t("closeClaim")}
          </p>
        </div>
      </div>
    </section>
  );
}
