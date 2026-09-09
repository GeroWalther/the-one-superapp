import { useTranslations } from "next-intl";
import {
} from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import { Vortex } from "./Vortex";
import { WhatIsSection } from "./WhatIsSection";
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

/**
 * The six verticals, in the order they are shown.
 *
 * Was seven, built around placeholder boxes; the supplied photography covers
 * these six, and Insurance and Wellness Resorts are folded into Business &
 * Wealth and Beauty & Wellness rather than left as tiles with nothing in them.
 * Their message keys are still in the files.
 */
/**
 * The eight tiles, and where each sits in the collage.
 *
 * Placement is explicit rather than flowed, because the point of the layout is
 * that the sizes differ: two tall portraits down the outer edges, two mid
 * blocks under them, and two smaller squares tucked into the corners the
 * heading leaves free. A flowed grid of equal cells says "here is a list"; an
 * uneven one says "here is a world", which is the claim being made.
 *
 * The `area` classes only apply from lg — below that the collage collapses to
 * a plain two-column grid, where any attempt at composition just reads as a
 * broken layout.
 */
/**
 * The eight tiles, and where each sits in the collage.
 *
 * Two placements each, because the composition is the point and it has to
 * survive a phone. `area` is the twelve-column desktop arrangement; `mArea` is
 * a six-column one that keeps the same character — staggered pairs, four sizes,
 * the claim set inside the collage rather than above it — at a scale where the
 * images are simply smaller.
 *
 * The one thing that cannot carry over is the claim being flanked. At 390px
 * the middle six of twelve columns is about 170px, which is too narrow to set
 * a heading in; on the phone it takes a full-width band between the upper and
 * lower halves instead, which is the same idea without the unreadable line.
 */
const TILES = [
  {
    key: "healthLongevity",
    src: "/images/verticals/health-longevity-v3.webp",
    area: "lg:col-start-1 lg:col-span-3 lg:row-start-1 lg:row-span-5",
    mArea: "col-start-1 col-span-3 row-start-1 row-span-6",
  },
  {
    key: "beautySkincare",
    src: "/images/verticals/beauty-wellness.webp",
    area: "lg:col-start-4 lg:col-span-3 lg:row-start-1 lg:row-span-3",
    mArea: "col-start-4 col-span-3 row-start-3 row-span-5",
  },
  {
    /* Top-centre-right, mirroring Beauty across the heading: the match is the
       thing the whole page is about, so it sits level with the claim rather
       than being tucked into the bottom of the collage. */
    key: "matchConnect",
    src: "/images/verticals/match-connect.webp",
    area: "lg:col-start-7 lg:col-span-3 lg:row-start-1 lg:row-span-3",
    mArea: "col-start-1 col-span-3 row-start-8 row-span-5",
  },
  {
    key: "luxuryHotels",
    src: "/images/verticals/luxury-hotels.webp",
    area: "lg:col-start-10 lg:col-span-3 lg:row-start-2 lg:row-span-5",
    mArea: "col-start-4 col-span-3 row-start-9 row-span-6",
  },
  {
    /* Bottom-centre-left, in the last corner the claim leaves open.
       Deliberately the squarest cell in the collage: this is the only frame
       with content either side of its subject — a beach on the left, a city on
       the right — and a portrait cell cropped both away. At 260x272 the cell
       is very slightly wider than the file, so object-cover trims a little
       ceiling and floor instead and the full width survives.

       -v3 is converted at the cell's own 0.96 ratio rather than the 4:5 the
       other tiles use. At 4:5 the conversion itself cropped 25% of the width
       before the cell ever saw it, which took the man on the right out of the
       frame entirely; at 0.96 it loses 5%, and both figures either side of the
       phone survive. */
    key: "messenger",
    src: "/images/verticals/messenger-v3.webp",
    area: "lg:col-start-4 lg:col-span-3 lg:row-start-8 lg:row-span-3",
    mArea: "col-start-1 col-span-3 row-start-19 row-span-4",
  },
  {
    key: "businessWealth",
    src: "/images/verticals/business-wealth.webp",
    area: "lg:col-start-7 lg:col-span-3 lg:row-start-8 lg:row-span-3",
    mArea: "col-start-4 col-span-3 row-start-20 row-span-5",
  },
  {
    key: "realEstate",
    src: "/images/verticals/real-estate.webp",
    area: "lg:col-start-1 lg:col-span-3 lg:row-start-6 lg:row-span-4",
    mArea: "col-start-1 col-span-3 row-start-23 row-span-6",
  },
  {
    key: "lifestyle",
    src: "/images/verticals/lifestyle.webp",
    area: "lg:col-start-10 lg:col-span-3 lg:row-start-7 lg:row-span-4",
    mArea: "col-start-4 col-span-3 row-start-25 row-span-6",
  },
];

export function PreviewLanding() {
  const t = useTranslations("preview");
  const tServices = useTranslations("services");
  /* The claim under the mark is the same claim the hero makes, so it reads
     from the same messages rather than a preview-only copy that would drift. */
  const tHero = useTranslations("hero");
  const tEnroll = useTranslations("enroll");



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
        {/* Deep bottom padding: the storm ends in near-black and the section
            below it is a dark band, so without a long run of pale ground
            between them the two darks touch and read as one block. The storm's
            blur also reaches past its own box, which eats the first stretch of
            whatever clearance it is given. */}
        <section className="mx-auto max-w-3xl px-6 pb-40 pt-16 text-center sm:pb-56 lg:px-8 lg:pb-64">
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

        {/* --- 4. the verticals --------------------------------------- */}
        {/* The claim sits inside the collage rather than above it: "in one
            place" is easier to believe when the place is drawn around the
            words. Below lg the heading is simply the first row of a two-column
            grid, which is the only honest way to stack it. */}
        {/* No background of its own: this sits on the page's own pale ground,
            the same one the storm above runs on, so the two read as one
            continuous stretch rather than two panels. */}
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-24 sm:pt-32 lg:px-8">
          <div className="grid auto-rows-[34px] grid-cols-6 gap-2 sm:auto-rows-[52px] sm:gap-3 lg:auto-rows-[80px] lg:grid-cols-12 lg:gap-4">
            <div
              data-reveal
              className="col-span-6 col-start-1 row-span-4 row-start-15 self-center text-center lg:col-span-6 lg:col-start-4 lg:row-span-4 lg:row-start-4 lg:px-4"
            >
              {/* The floor carries the phone: at 4.2vw a 390px screen resolved to
                    the 22px minimum, which set the claim smaller than the tile
                    captions under it. 30px is the size at which it reads as the
                    heading of the section rather than a caption for it. */}
              <h2 className="font-display text-[clamp(30px,4.2vw,40px)] font-bold leading-[1.2] tracking-[0.05em] text-[#0a2f34] sm:leading-[1.25] sm:tracking-[0.06em]">
                {/* Two keys rather than one string split on the full stop:
                    German puts a comma inside its first line, and any rule
                    that finds the break by punctuation would cut it in the
                    wrong place. */}
                <span className="block">{t("everythingLine1")}</span>
                <span className="mt-1 block text-[#8a6420] sm:mt-2">
                  {t("everythingLine2")}
                </span>
              </h2>

            </div>

            {TILES.map((tile, i) => (
              <figure
                key={tile.key}
                data-reveal
                data-reveal-delay={`${100 + i * 70}`}
                className={`group relative overflow-hidden rounded-2xl bg-paper-soft shadow-[0_14px_36px_-20px_rgba(43,52,64,0.55)] ${tile.mArea} ${tile.area}`}
              >
                <Image
                  src={tile.src}
                  alt={tServices(tile.key)}
                  fill
                  /* The cells differ in width, so one fixed hint would be wrong
                     for most of them; 30vw covers the widest at lg and up. */
                  sizes="(min-width: 1024px) 30vw, 45vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                />

                {/* A gradient from the bottom rather than a flat overlay: the
                    caption needs a dark ground, the photograph does not. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#001416]/85 via-[#001416]/20 to-transparent"
                />

                <figcaption className="absolute inset-x-0 bottom-0 p-2.5 sm:p-4 lg:p-5">
                  {/* 15px is the floor for body-sized type on this site, so the
                      caption does not shrink with the tile. Heavier on the
                      phone only: over a photograph at this size a light display
                      weight loses its thin strokes into the image behind it,
                      while the larger desktop tiles still carry light. */}
                  <span className="font-display text-[15px] font-medium text-white sm:font-light lg:text-[17px]">
                    {tServices(tile.key)}
                  </span>
                </figcaption>
              </figure>
            ))}
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
