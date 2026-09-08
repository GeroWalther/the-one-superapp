import { useTranslations } from "next-intl";
import {
  Award,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import { Vortex } from "./Vortex";
import { WhatIsSection } from "./WhatIsSection";
import { Placeholder } from "@/components/Placeholder";
import { WaitlistCard } from "./WaitlistCard";
import { ApplyChooser } from "@/components/ApplyChooser";
import Image from "next/image";

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

/**
 * Breaks the tagline after the product term, so what follows — "THAT
 * UNDERSTANDS YOU", "DIE SIE VERSTEHT" — always lands on its own line directly
 * beneath it rather than only when the viewport happens to be narrow enough.
 *
 * Split on "POWER AI" rather than on the English words, because that token is
 * the one part both locales share; the comma German puts after it stays on the
 * first line where it belongs. If the copy ever loses the term the whole
 * string is returned as one line and simply wraps as before.
 */
const TAGLINE_TERM = "POWER AI";

function splitTagline(tagline: string) {
  const found = tagline.indexOf(TAGLINE_TERM);
  if (found === -1) return [tagline];

  let end = found + TAGLINE_TERM.length;
  if (tagline[end] === ",") end += 1;

  return [
    /* Non-breaking space inside the term itself: the first line is still free
       to wrap on a very narrow phone, and this keeps it from splitting there. */
    tagline.slice(0, end).replace(TAGLINE_TERM, "POWER AI"),
    tagline.slice(end).trim(),
  ];
}

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
  /* The claim under the mark is the same claim the hero makes, so it reads
     from the same messages rather than a preview-only copy that would drift. */
  const tHero = useTranslations("hero");
  const tEnroll = useTranslations("enroll");


  const benefits = [
    { icon: ShieldCheck, title: t("benefit1"), meta: t("benefit1Meta") },
    { icon: Sparkles, title: t("benefit2"), meta: t("benefit2Meta") },
    { icon: Award, title: t("benefit3"), meta: t("benefit3Meta") },
  ];

  const taglineLines = splitTagline(tHero("tagline"));

  return (
    /* Ground tinted off the petrol family rather than neutral grey, so the
       green ribbons read as this page's colour instead of green over grey. */
    <div className="relative overflow-hidden bg-[#eef3f3]">
      {/* Light ribbons sweeping the background — the mockup's signature. */}
      <Ribbons />

      <div className="relative">
        {/* --- 1. split hero ------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-24">
          {/* The mark, the claim and the tagline are one centred masthead;
              the split below then breaks the axis deliberately. The stagger
              runs top-down — 0, 120, 200, 280 — so the eye is led rather than
              having the tagline arrive before the line above it, which is what
              the old 120/40 pairing did. */}
          <div data-reveal className="flex justify-center">
            <div className="float-slow relative">
              <div
                aria-hidden="true"
                className="absolute -inset-8 rounded-full bg-aqua-200/40 blur-3xl"
              />
              <Image
                src="/images/theone-lockup.png"
                alt="TheONE Super App"
                width={252}
                height={384}
                priority
                /* Next's image optimiser re-encodes transparent PNGs to a palette
                   whose alpha the browser does not honour, which brings the white
                   background back. Served as-is instead. */
                unoptimized
                /* Height-driven so the lockup's own proportions decide the width;
                   no drop-shadow, since the artwork already carries one under the
                   icon and a second would fall across the wordmark too. Same
                   312px from the smallest screen up: the mark is the strongest
                   asset here and is meant to dominate the phone view. */
                className="relative h-[312px] w-auto lg:h-[372px]"
              />
            </div>
          </div>

          {/* The page's one h1. It was demoted to h2 while HeroSection sat
              above and owned that role; with HeroSection gone from page.tsx
              this masthead is the top of the document and has to carry it, or
              the page has no h1 at all. */}
          <h1
            data-reveal
            data-reveal-delay="120"
            /* max-w-3xl, not 6xl: the hero sets this claim inside a max-w-3xl
               column, so an unconstrained line here would run to 1152px and
               set the identical words at a completely different measure. */
            /* Held to one line on a phone by three things at once, because no
               one of them is enough: tracking down to 0.03em (0.06em across 36
               characters was adding 43px of pure letter-spacing), -mx-3 to
               borrow half the section's px-6 gutter back, and a size that
               follows the viewport instead of a fixed 20px. Above sm it
               returns to the tracked, centred setting. */
            className="-mx-3 -mt-5 max-w-3xl text-balance text-center font-display text-[clamp(12px,4.3vw,20px)] font-bold leading-[1.3] tracking-[0.03em] text-[#0a2f34] sm:mx-auto sm:mt-6 sm:text-[24px] sm:tracking-[0.08em] lg:text-[28px]"
          >
            {tHero("titleLine1")}{" "}
            {/* Inline, not a block: the two halves are one sentence, and forcing
                a break mid-phrase made it read as two. It still wraps naturally
                on narrow viewports. */}
            {/* Flat, and a darker gold than the mark's own: #b8914a sat too close
                in value to the pale hero behind it to read comfortably at this
                size. No gradient — it thinned the phrase mid-word. */}
            <span className="text-[#8a6420]">{tHero("titleAccent")}</span>
          </h1>

          {/* Directly under the claim, so the two read as one masthead. Same
              treatment as the hero's: display face, not tracked uppercase, and
              the caps live in the message so "TheONE" keeps its brand casing
              rather than being flattened to "THEONE" by text-transform. */}
          <p
            data-reveal
            data-reveal-delay="200"
            /* Same reason as the line above, and more acute here: at 17px with
               0.09em tracking the phone broke this between "POWER" and "AI",
               splitting the one term the sentence is about. No text-balance:
               the break is placed deliberately below, and balancing would pull
               words back across it. */
            className="mx-auto mt-5 max-w-2xl text-center font-display text-[15px] font-bold leading-[1.5] tracking-[0.05em] text-[#0a2f34] sm:mt-6 sm:text-[19px] sm:tracking-[0.09em] lg:text-[21px]"
          >
            {/* Blocks rather than <br>: the break is part of how the claim is
                set, so it holds at every width instead of only where the line
                happened to run out. */}
            {taglineLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>

          {/* A hairline closing the masthead before the axis changes to the
              split below — without it the centred block and the left-aligned
              column read as one ragged run. */}
          <div
            aria-hidden="true"
            data-reveal
            data-reveal-delay="240"
            className="mx-auto mt-10 h-px w-24 bg-gradient-to-r from-transparent via-[#8a6420]/45 to-transparent sm:mt-12"
          />

          <div className="mt-12 grid items-center gap-10 sm:mt-16 sm:gap-12 lg:mt-20 lg:grid-cols-2">
            {/* Centred while the column is stacked, so the phone doesn't sit
                under a left-ragged block on one axis and a centred masthead on
                another; left-aligned only once the split actually exists. */}
            <div
              data-reveal
              data-reveal-delay="280"
              className="text-center lg:text-left"
            >
              <h2 className="text-balance font-display text-[32px] font-light leading-[1.12] text-ink sm:text-[40px] lg:text-[52px]">
                {t("heroTitle")}
              </h2>
              <p className="mx-auto mt-4 max-w-md text-pretty text-[15px] leading-[1.6] text-ink-soft sm:mt-5 sm:text-[16px] lg:mx-0">
                {t("heroSubtitle")}
              </p>

              {/* The two application paths stand where the waiting-list button
                  used to. A button promised a queue; these name the two kinds
                  of visitor and start the actual application, so the strongest
                  spot on the page now carries the real decision. Filled with
                  the primary gradient the button had, which is what keeps this
                  reading as the page's call to action. */}
              <h3 className="mt-9 font-display text-[26px] font-light leading-tight text-ink sm:mt-10 sm:text-[30px]">
                {tEnroll("chooser.title")}
              </h3>
              {/* Padding pulled in from p-7 for the fill: in this column the
                  pair has ~268px a card, and 28px of inset on both sides left
                  the description setting too narrow. */}
              <div className="mt-6 [&_button]:p-6">
                <ApplyChooser tone="fill" showProcessNote={false} />
              </div>
            </div>

            {/* The device was the one element in this section that popped in
                with no transition while everything around it faded. */}
            <div
              data-reveal
              data-reveal-delay="360"
              className="flex justify-center lg:justify-end"
            >
              <PhoneMockup />
            </div>
          </div>

        </section>

        {/* --- 2. wordmark --------------------------------------------- */}
        <section className="mx-auto max-w-3xl px-6 py-16 text-center lg:px-8">
          <p className="font-display text-[46px] font-light leading-none text-ink sm:text-[56px]">
            The<span className="font-normal">ONE</span>
          </p>
          {/* The wordmark's line of copy is gone; this stands in its place as
              pure ornament. It says nothing the sections below do not say
              better, and a mark this loud under a mark that quiet is the
              point — the page needs one moment of spectacle. */}
          {/* Claim above the storm, not on it: over the eye the paragraph sat
              on the brightest passage of the whole page and the two fought.
              Only the product name goes inside now, where the eye gives it a
              lit ground of its own. */}
          <h2
            data-reveal
            className="mx-auto mt-10 max-w-2xl text-balance font-display text-[clamp(26px,6vw,52px)] font-bold leading-[1.15] tracking-[0.06em] text-[#0a2f34] sm:mt-12"
          >
            {t("worldTitle")}
          </h2>
          <p
            data-reveal
            data-reveal-delay="120"
            /* The storm's outer rim, literally: #001416 is the abyssDeep the wall is
               painted in, so the paragraph and the edge of the disc below it are
               the same colour rather than merely close. */
            className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-[1.7] text-[#001416] sm:mt-6 sm:text-[17px]"
          >
            {t("worldBody")}
          </p>

          {/* The storm's own blur reaches well above its box, so it needs more
              clearance under the paragraph than a hard-edged element would. */}
          <div data-reveal data-reveal-delay="200" className="mt-14 sm:mt-20">
            <Vortex>
              <span className="font-display text-[clamp(23px,4.2vw,44px)] font-bold uppercase leading-none tracking-[0.2em] text-[#0a2f34]">
                {t("eyeLabel")}
              </span>
            </Vortex>
          </div>

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
          {/* <div className="mt-12">
            <WaitlistCard />
          </div> */}
        </section>

        {/* --- 3. what is TheONE -------------------------------------- */}
        <WhatIsSection />

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


/**
 * The sweeping light ribbons behind the mockup's whole page.
 *
 * Drawn once, at the width it was designed for, and cropped rather than
 * squashed. The field is stretched to fit with preserveAspectRatio="none", so
 * a fixed 1440-wide viewBox in a 390px column compressed every curve
 * horizontally into tight vertical streaks. Giving the svg min-w-[1440px] and
 * centring it means a phone sees the middle of the same field the desktop
 * sees: identical curvature, identical band width, just less of it. w-full
 * keeps wider screens behaving exactly as before.
 */
function Ribbons() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        className="absolute left-1/2 top-0 h-full w-full min-w-[1440px] max-w-none -translate-x-1/2"
        preserveAspectRatio="none"
        viewBox="0 0 1440 2400"
      >
        <defs>
          {/* The hero's petrol family rather than the old white-to-grey wash,
              but kept pale: --petrol-100 through the body of each ribbon with
              only a thin --petrol-300 at the turn, so the waves stay light and
              never come close to competing with the type over them. */}
          <linearGradient id="pv-ribbon" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#85acac" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#d6e3e3" stopOpacity="0.1" />
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
