import { useTranslations } from "next-intl";
import {
  Award,
  CreditCard,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import { Placeholder } from "@/components/Placeholder";
import { WaitlistCard } from "./WaitlistCard";
import { ApplySection } from "../ApplySection";

/**
 * The mockup design, built as a comparison block above the live landing page.
 *
 * Kept entirely self-contained — its own imagery, its own scale, no shared
 * components with the section below except the phone — so that judging one
 * design cannot accidentally change the other, and so the whole thing can be
 * deleted in one line once a direction is chosen.
 *
 * It runs on a cool near-white ground with soft light-ribbons, which is what
 * distinguishes the mockup from the current mint-washed page.
 */

const TILES = [
  {
    key: "healthLongevity",
    className: "sm:col-span-2 sm:row-span-2",
    lead: true,
  },
  { key: "beautySkincare" },
  { key: "wellnessResorts" },
  { key: "luxuryHotels" },
  { key: "lifestyle" },
  {
    key: "realEstate",
    className: "sm:col-span-2",
  },
  {
    key: "insurance",
    className: "sm:col-span-2",
  },
];

export function PreviewLanding() {
  const t = useTranslations("preview");
  const tServices = useTranslations("services");

  const pillars = [
    { icon: Zap, title: t("decision"), meta: t("decisionMeta") },
    { icon: MessagesSquare, title: t("connection"), meta: t("connectionMeta") },
    { icon: CreditCard, title: t("transaction"), meta: t("transactionMeta") },
  ];

  const benefits = [
    { icon: ShieldCheck, title: t("benefit1"), meta: t("benefit1Meta") },
    { icon: Sparkles, title: t("benefit2"), meta: t("benefit2Meta") },
    { icon: Award, title: t("benefit3"), meta: t("benefit3Meta") },
  ];

  return (
    <div className="relative overflow-hidden bg-[#f4f6f7]">
      {/* Light ribbons sweeping the background — the mockup's signature. */}
      <Ribbons />

      <div className="relative">
        {/* --- 1. split hero ------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-6 pb-8 pt-16 lg:px-8 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="font-display text-[40px] font-light leading-[1.12] text-ink sm:text-[52px]">
                {t("heroTitle")}
              </h1>
              <p className="mt-5 max-w-md text-[16px] leading-[1.6] text-ink-soft">
                {t("heroSubtitle")}
              </p>
              <button
                type="button"
                className="btn btn-primary mt-8 px-8 py-3.5 text-[15px]"
              >
                {t("waitlistCta")}
              </button>
            </div>

            <div className="flex justify-center lg:justify-end">
              <PhoneMockup />
            </div>
          </div>
        </section>

        {/* --- 2. wordmark, clarity rule, waitlist --------------------- */}
        <section className="mx-auto max-w-3xl px-6 py-16 text-center lg:px-8">
          <p className="font-display text-[46px] font-light leading-none text-ink sm:text-[56px]">
            The<span className="font-normal">ONE</span>
          </p>
          <p className="mx-auto mt-7 max-w-xl font-display text-[21px] font-light leading-[1.5] text-ink-soft sm:text-[24px]">
            {t("wordmarkSubtitle")}
          </p>

          {/* <div className="mx-auto mt-8 flex max-w-md items-center gap-4">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-line" />
            <span className="text-[15px] italic text-ink-soft">
              {t("clarity")}
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-line" />
          </div>

          <button
            type="button"
            className="btn btn-primary mt-9 px-10 py-3.5 text-[15.5px]"
          >
            {t("waitlistCta")}
          </button> */}
<ApplySection/>
          {/* <div className="mt-12">
            <WaitlistCard />
          </div> */}
        </section>

        {/* --- 3. what is TheONE -------------------------------------- */}
        <section className="mx-auto max-w-4xl px-6 py-14 text-center lg:px-8">
          <RuleHeading>{t("whatTitle")}</RuleHeading>

          <p className="mx-auto mt-8 max-w-2xl text-[16px] leading-[1.7] text-ink-soft">
            {t.rich("whatBody", {
              strong: (chunks) => (
                <strong className="font-semibold text-ink">{chunks}</strong>
              ),
            })}
          </p>

          <dl className="mt-12 grid gap-y-10 sm:grid-cols-3 sm:divide-x sm:divide-line">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="px-4">
                <pillar.icon
                  className="mx-auto h-6 w-6 text-aqua-500"
                  strokeWidth={1.4}
                />
                <dt className="mt-4 font-display text-[24px] font-light text-ink">
                  {pillar.title}
                </dt>
                <dd className="mt-2 flex items-center justify-center gap-2 text-[14px] text-ink-soft">
                  <pillar.icon
                    className="h-3.5 w-3.5 text-aqua-400"
                    strokeWidth={1.6}
                  />
                  {pillar.meta}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* --- 4. the vertical tiles ---------------------------------- */}
        <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
          <div className="grid auto-rows-[132px] grid-cols-2 gap-3 sm:grid-cols-4 sm:auto-rows-[150px]">
            {TILES.map((tile) => (
              <figure
                key={tile.key}
                className={`group relative overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_-18px_rgba(43,52,64,0.5)] ${
                  tile.className ?? ""
                }`}
              >
                <Placeholder label={tServices(tile.key)} />
                {/* Caption sits in a frosted strip on the image, as drawn. */}
                <figcaption
                  className={`absolute inset-x-0 bottom-0 bg-white/85 px-4 backdrop-blur-sm ${
                    tile.lead ? "py-3.5" : "py-2.5"
                  }`}
                >
                  <span
                    className={
                      tile.lead
                        ? "font-display text-[21px] font-light text-ink"
                        : "text-[13px] text-ink"
                    }
                  >
                    {tServices(tile.key)}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* --- 5. exclusive benefits ---------------------------------- */}
        <section className="mx-auto max-w-5xl px-6 py-16 text-center lg:px-8">
          <h2 className="font-display text-[32px] font-light text-ink sm:text-[38px]">
            {t("benefitsTitle")}
          </h2>
          <p className="mt-4 text-[15.5px] text-ink-soft">
            {t("benefitsSubtitle")}
          </p>

          <dl className="mt-12 grid gap-y-10 border-y border-line py-10 sm:grid-cols-3 sm:divide-x sm:divide-line">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="px-4">
                <benefit.icon
                  className="mx-auto h-6 w-6 text-aqua-500"
                  strokeWidth={1.3}
                />
                <dt className="mt-4 font-display text-[21px] font-light text-ink">
                  {benefit.title}
                </dt>
                <dd className="mt-1.5 text-[13.5px] text-ink-faint">
                  {benefit.meta}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* --- 6. collage + closing call ------------------------------ */}
        <section className="mx-auto max-w-6xl px-6 pb-20 lg:px-8">
          <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr]">
            <div className="relative aspect-4/3 overflow-hidden rounded-2xl shadow-[0_14px_36px_-20px_rgba(43,52,64,0.5)] sm:aspect-auto sm:h-[380px]">
              <Placeholder />
              </div>
            <div className="grid gap-3">
              {["upper", "lower"].map((slot) => (
                <div
                  key={slot}
                  className="relative aspect-16/9 overflow-hidden rounded-2xl shadow-[0_14px_36px_-20px_rgba(43,52,64,0.5)] sm:aspect-auto sm:h-[184px]"
                >
                  <Placeholder />
                  </div>
              ))}
            </div>
          </div>

          <div className="mt-14 text-center">
            <h2 className="font-display text-[32px] font-light text-ink sm:text-[38px]">
              {t("discoverTitle")}
            </h2>
            <p className="mt-3 text-[15.5px] text-ink-soft">
              {t("discoverSubtitle")}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {[t("becomePartner"), t("becomeMember")].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="btn btn-primary w-full px-8 py-3.5 text-[13.5px] font-semibold uppercase tracking-[0.1em] sm:w-auto"
                >
                  {label}
                </button>
              ))}
            </div>

            <p className="mt-12 text-[14px] text-ink-soft">{t("accessNote")}</p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-ink-faint">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-aqua-500" strokeWidth={1.5} />
                {t("secure")}
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-aqua-500" strokeWidth={1.5} />
                {t("discreet")}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function RuleHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-5">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-line" />
      <h2 className="font-display text-[27px] font-light text-ink sm:text-[31px]">
        {children}
      </h2>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-line" />
    </div>
  );
}

/** The sweeping light ribbons behind the mockup's whole page. */
function Ribbons() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 1440 2400"
      >
        <defs>
          <linearGradient id="pv-ribbon" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#dcebee" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {[0, 150, 300, 460].map((offset) => (
          <path
            key={offset}
            d={`M-100,${380 + offset} C 380,${120 + offset} 900,${640 + offset} 1540,${200 + offset}`}
            fill="none"
            stroke="url(#pv-ribbon)"
            strokeWidth={130}
            opacity={0.5}
          />
        ))}
        <path
          d="M-100,1500 C 420,1240 940,1760 1540,1320"
          fill="none"
          stroke="url(#pv-ribbon)"
          strokeWidth={190}
          opacity={0.45}
        />
      </svg>
    </div>
  );
}
