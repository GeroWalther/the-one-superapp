import { useTranslations } from "next-intl";
import { Building2, UsersRound } from "lucide-react";
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
    area: "   ",
    mArea: "col-start-1 col-span-3 row-start-1 row-span-6",
  },
  {
    key: "beautySkincare",
    src: "/images/verticals/beauty-wellness.webp",
    area: "   ",
    mArea: "col-start-4 col-span-3 row-start-3 row-span-5",
  },
  {
    /* Top-centre-right, mirroring Beauty across the heading: the match is the
       thing the whole page is about, so it sits level with the claim rather
       than being tucked into the bottom of the collage.

       -v2 is the same photograph lifted in the midtones (gamma 1.32, a little
       brightness and saturation with it). It is the only dusk shot in the
       collage, so the caption scrim that reads as a soft wash over the others
       was landing on an already dark lower half and the couple disappeared
       into it. Lifting the file rather than lightening the scrim keeps every
       tile's caption on the same ground. */
    key: "matchConnect",
    src: "/images/verticals/match-connect-v2.webp",
    area: "   ",
    mArea: "col-start-1 col-span-3 row-start-8 row-span-5",
  },
  {
    key: "luxuryHotels",
    src: "/images/verticals/luxury-hotels-v2.webp",
    area: "   ",
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
    area: "   ",
    mArea: "col-start-1 col-span-3 row-start-19 row-span-4",
  },
  {
    key: "businessWealth",
    src: "/images/verticals/business-wealth.webp",
    area: "   ",
    mArea: "col-start-4 col-span-3 row-start-20 row-span-5",
  },
  {
    key: "realEstate",
    src: "/images/verticals/real-estate-v2.webp",
    area: "   ",
    mArea: "col-start-1 col-span-3 row-start-23 row-span-6",
  },
  {
    key: "lifestyle",
    src: "/images/verticals/lifestyle.webp",
    area: "   ",
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

  return (
    /* Ground tinted off the petrol family rather than neutral grey, so the
       green ribbons read as this page's colour instead of green over grey. */
    <div className="relative overflow-hidden bg-[#eef3f3]">
      {/* Light ribbons sweeping the background — the mockup's signature. */}
      <Ribbons />

      <div className="relative">
        {/* --- 1. split hero ------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 sm:pb-20 sm:pt-16 lg:max-w-4xl lg:px-8 lg:pb-24 lg:pt-24">
          {/* The mark, the claim and the tagline are one centred masthead;
              the split below then breaks the axis deliberately. The stagger
              runs top-down — 0, 120, 200, 280 — so the eye is led rather than
              having the tagline arrive before the line above it, which is what
              the old 120/40 pairing did. */}
          <div data-reveal className="flex justify-center pt-9 lg:pt-11">
            <div className="float-slow relative">
              <div
                aria-hidden="true"
                className="absolute -inset-8 rounded-full bg-aqua-200/40 blur-3xl"
              />
              <Image
                src="/images/theone-lockup-v4.png"
                alt="TheONE Super App"
                width={533}
                height={677}
                priority
                /* Next's image optimiser re-encodes transparent PNGs to a palette
                   whose alpha the browser does not honour, which brings the white
                   background back. Served as-is instead. */
                unoptimized
                /* Height-driven so the lockup's own proportions decide the width;
                   no drop-shadow, since the artwork already carries one under the
                   icon and a second would fall across the wordmark too. Same
                   size from the smallest screen up: the mark is the strongest
                   asset here and is meant to dominate the phone view. */
                className="relative h-[214px] w-auto lg:h-[257px]"
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
            /* On a phone it is set for reading, not held to one line: squeezed
               onto one it came out around 17px, too small to read comfortably,
               so it takes two balanced lines at 22px instead. Above sm it
               returns to the tracked, centred setting. */
            className="mx-auto mt-4 max-w-3xl text-balance text-center font-display text-[22px] font-bold leading-[1.3] tracking-[0.04em] text-[#0a2f34] sm:mx-auto sm:mt-6 sm:text-[24px] sm:tracking-[0.08em] lg:text-[28px]"
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


          {/* The app in use: real moments with TheONE POWER AI, set side by
              side at one height, each at its own width, so no one is cropped
              out. Always one row; the height follows the width. */}
          <div data-reveal data-reveal-delay="220" className="relative left-1/2 mt-10 flex w-[min(1120px,96vw)] -translate-x-1/2 flex-nowrap justify-center gap-2 sm:mt-12 sm:gap-4">
            {[
              { src: "/images/theone-businessman.jpg", w: 585, h: 729, alt: "Geschäftsmann zeigt die TheONE SUPER APP" },
              { src: "/images/theone-emirati.jpg", w: 585, h: 389, alt: "Zwei Emiratis mit TheONE POWER AI in Dubai" },
              { src: "/images/theone-businesswoman.jpg", w: 585, h: 704, alt: "Geschäftsfrau zeigt die TheONE SUPER APP" },
            ].map((photo) => (
              <Image
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                width={photo.w}
                height={photo.h}
                priority
                className="h-[min(260px,calc((min(1120px,96vw)-16px)/3.15))] w-auto rounded-xl shadow-[0_18px_40px_-22px_rgba(0,37,42,0.55)] ring-1 ring-[#005252]/10 sm:h-[min(260px,calc((min(1120px,96vw)-32px)/3.15))] sm:rounded-2xl"
              />
            ))}
          </div>

          {/* Under the photos: the invitation, first to members, then to
              business partners. */}
          <div data-reveal data-reveal-delay="240" className="mx-auto mt-10 max-w-2xl text-center sm:mt-12">
            <h2 className="font-display text-[22px] font-bold uppercase leading-[1.3] tracking-[0.02em] text-[#8a6420] sm:text-[24px] sm:tracking-[0.05em] lg:text-[28px]">
              {t("askTitle")}
            </h2>
            <p className="-mx-3 mt-2 text-[15px] leading-[1.7] text-[var(--petrol-900)] sm:mx-0 sm:text-[18px]">
              {t("askLine1")}
              <span className="block">{t.rich("askLine2", { b: (c) => <strong className="font-semibold">{c}</strong> })}</span>
              <span className="block">{t.rich("askLine3", { b: (c) => <strong className="font-semibold">{c}</strong> })}</span>
            </p>
          </div>

          {/* A hairline closing the masthead before the axis changes to the
              split below — without it the centred block and the left-aligned
              column read as one ragged run. */}
          <div
            aria-hidden="true"
            data-reveal
            data-reveal-delay="240"
            className="mx-auto mt-10 h-px w-24 bg-gradient-to-r from-transparent via-[#8a6420]/45 to-transparent sm:mt-12"
          />

          <div className="mt-12 grid items-center gap-16 sm:mt-16 sm:gap-[72px] lg:mt-20  ">
            {/* Centred while the column is stacked, so the phone doesn't sit
                under a left-ragged block on one axis and a centred masthead on
                another; left-aligned only once the split actually exists. */}
            <div
              data-reveal
              data-reveal-delay="280"
              className="text-center "
            >
              <h2 className="text-balance font-display text-[clamp(24px,calc((100vw_-_48px)*0.097),32px)] font-semibold leading-[1.12] text-[#000f11] sm:text-[40px] sm:font-medium lg:text-[52px]">
                {t("heroTitle")}
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-pretty text-[18.9px] leading-[1.6] text-[#37414d] sm:mt-2 sm:text-[16.8px] ">
                {t("heroSubtitle")}
              </p>

              {/* The two application paths stand where the waiting-list button
                  used to. A button promised a queue; these name the two kinds
                  of visitor and start the actual application, so the strongest
                  spot on the page now carries the real decision. Filled with
                  the primary gradient the button had, which is what keeps this
                  reading as the page's call to action. */}
              {/* Framed in the brand card (white, aqua rim, teal hairline on
                  top) so the business pitch reads as one unit with the two
                  application cards below it. */}
              <div className="card-brand mt-9 px-6 py-7 text-center sm:mt-10 sm:px-8 lg:[zoom:1.05]">
                <p className="text-balance font-sans text-[20px] font-semibold leading-snug tracking-[0.06em] text-[#0a2f34] sm:text-[23px]">
                  {/* Caps live in the message, so "TheONE" keeps its brand casing. */}
                  {t("businessClaim").split("|").map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
                {/* German only: the longer pitch under the claim. */}
                {t.has("businessText") && (
                  <p className="mx-auto mt-4 max-w-lg text-pretty text-[17px] font-semibold leading-[1.6] text-[#2f4744] sm:text-[18px]">
                    {t("businessText")}
                  </p>
                )}
                {/* Problem, then answer: the answer gets its own line in rich
                    petrol, the brand colour. */}
                <p className="mx-auto mt-4 max-w-lg text-pretty text-[18.05px] font-medium leading-[1.55] text-[#434d59] sm:text-[19px]">
                  {t("businessLine1")}
                  <span className="block font-semibold text-[#005252]">
                    {t("businessLine2")}
                  </span>
                </p>
                {/* Business — TheONE — client: the sentence above drawn as a
                    connection. Decorative, the copy carries the meaning. */}
                <div
                  aria-hidden="true"
                  className="mx-auto mt-6 flex max-w-[300px] items-center"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1a626b] to-[#00353b] shadow-[0_6px_14px_-6px_rgba(0,37,42,0.55)]">
                    <Building2 className="h-5 w-5 text-white" strokeWidth={1.6} />
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-[#005252]/60 to-[#005252]" />
                  <Image
                    src="/images/theone-icon-v2.png"
                    alt=""
                    width={256}
                    height={256}
                    unoptimized
                    className="h-10 w-10 shrink-0 rounded-[11px] shadow-[0_6px_14px_-6px_rgba(0,37,42,0.55)]"
                  />
                  <span className="h-px flex-1 bg-gradient-to-r from-[#005252] to-[#005252]/60" />
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1a626b] to-[#00353b] shadow-[0_6px_14px_-6px_rgba(0,37,42,0.55)]">
                    <UsersRound className="h-5 w-5 text-white" strokeWidth={1.6} />
                  </span>
                </div>
              </div>
              <h3 className="mt-16 font-display text-[26px] font-medium leading-tight text-ink sm:mt-20 sm:text-[30px]">
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
              className="flex justify-center "
            >
              <PhoneMockup />
            </div>
          </div>

          {/* "Deine Wünsche. Deine Welt. Deine TheONE." under the phone, set as
              live text from the supplied artwork. On wide screens it sits in
              the phone's column (right), on phones it follows the device. */}
          <div data-reveal className="mt-16 max-w-[560px]  lg:mt-20">
            <h2 className="font-sans text-[40px] font-medium leading-[1.08] tracking-[-0.02em] text-[#123b38] sm:text-[52px] lg:text-[56px]">
              {t("wishes.line1")}
              <br />
              {t("wishes.line2")}
              <br />
              <span className="text-[#4a8a6e]">{t("wishes.line3")}</span>
            </h2>
            <p className="mt-8 text-[17px] font-semibold leading-[1.7] text-[#2f4744] sm:text-[19px]">{t("wishes.p1")}</p>
            <p className="mt-5 text-[15px] font-semibold leading-[1.7] text-[#2f4744] sm:text-[17px]">{t("wishes.p2")}</p>
          </div>

        </section>

        {/* --- 2. wordmark --------------------------------------------- */}
        {/* Deep bottom padding: the storm ends in near-black and the section
            below it is a dark band, so without a long run of pale ground
            between them the two darks touch and read as one block. The storm's
            blur also reaches past its own box, which eats the first stretch of
            whatever clearance it is given. */}
        <section className="mx-auto max-w-3xl px-6 pb-40 pt-16 text-center sm:pb-56 lg:px-8 lg:pb-64">
          {/* The "TheONE" wordmark above this claim was removed on request. */}
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
            className="mx-auto mt-10 max-w-2xl text-balance font-display text-[clamp(27.3px,6.3vw,52px)] font-bold leading-[1.15] tracking-[0.06em] text-[#00252a] sm:mt-12 sm:text-[clamp(26px,6vw,52px)]"
          >
            {t("worldTitle")}
          </h2>
          <p
            data-reveal
            data-reveal-delay="120"
            /* The storm's outer rim, literally: #001416 is the abyssDeep the wall is
               painted in, so the paragraph and the edge of the disc below it are
               the same colour rather than merely close. */
            className="mx-auto mt-5 max-w-xl text-pretty text-[15.75px] font-semibold leading-[1.7] text-[#00252a] sm:mt-6 sm:text-[17px] lg:text-[17.85px]"
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
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-24 sm:pt-32 lg:max-w-4xl lg:px-8">
          <div className="grid auto-rows-[34px] grid-cols-6 gap-2 sm:auto-rows-[52px] sm:gap-3   ">
            <div
              data-reveal
              className="col-span-6 col-start-1 row-span-4 row-start-15 self-center text-center     lg:px-4"
            >
              {/* The floor carries the phone: at 4.2vw a 390px screen resolved to
                    the 22px minimum, which set the claim smaller than the tile
                    captions under it. 30px is the size at which it reads as the
                    heading of the section rather than a caption for it. */}
              {/* Set identically to the "YOUR WORLD. UNDERSTOOD." claim above:
                  same clamp, leading and tracking, so the page makes its two
                  big statements in one voice rather than two near-misses. */}
              <h2 className="font-display text-[clamp(26px,6vw,52px)] font-bold leading-[1.15] tracking-[0.06em] text-[#0a2f34]">
                {/* Two keys rather than one string split on the full stop:
                    German puts a comma inside its first line, and any rule
                    that finds the break by punctuation would cut it in the
                    wrong place. */}
                {/* Three lines: "EVERYTHING THAT" / "MATTERS TO YOU" / "IN ONE PLACE". */}
                {t("everythingLine1")
                  .split(/(?<=THAT) /)
                  .map((part) => (
                    <span key={part} className="block whitespace-nowrap">
                      {part}
                    </span>
                  ))}
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
