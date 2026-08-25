import type { Metadata } from "next";
import Image from "next/image";
import {
  Cormorant_Garamond,
  Gilda_Display,
  Italiana,
  Marcellus,
  Tenor_Sans,
} from "next/font/google";
import { HeroSection } from "@/components/HeroSection";

/**
 * Typeface comparison for the client.
 *
 * The hero is rendered once per candidate, stacked, so the fonts are judged on
 * the actual headline at the actual size rather than on a specimen line. Only
 * the heading face changes — body copy stays on Inter, because a display serif
 * at 13–15px is measurably harder to read across a paragraph.
 *
 * Not linked from anywhere. It is a decision aid, and it should disappear once
 * the decision is made.
 */

export const metadata: Metadata = {
  title: "Font comparison — TheONE",
  robots: { index: false, follow: false },
};

/* Each face gets its own variable; the wrapper then points --font-display at
   whichever one it is showing, and every `font-display` inside the hero
   follows without the hero knowing anything about this page. */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--f-cormorant",
});
const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--f-marcellus",
});
const italiana = Italiana({
  subsets: ["latin"],
  weight: "400",
  variable: "--f-italiana",
});
const tenor = Tenor_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--f-tenor",
});
const gilda = Gilda_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--f-gilda",
});

const CANDIDATES = [
  {
    name: "Cormorant Garamond",
    variable: "--f-cormorant",
    note: "What the site uses today. Calligraphic angled serifs and high contrast — elegant, but not the logo's letterform.",
  },
  {
    name: "Marcellus",
    variable: "--f-marcellus",
    note: "Closest structural match to the logo: low contrast, straight serifs, classical proportions.",
  },
  {
    name: "Italiana",
    variable: "--f-italiana",
    note: "Lighter and finer, nearest the logo's hairline weight. More stylised, so more personality.",
  },
  {
    name: "Tenor Sans",
    variable: "--f-tenor",
    note: "Barely-serifed and very light. The quietest option, closest to the logo's even stroke weight.",
  },
  {
    name: "Gilda Display",
    variable: "--f-gilda",
    note: "Between Marcellus and Cormorant — a little warmer, slightly more contrast.",
  },
];

export default function FontComparisonPage() {
  return (
    <div
      className={`${cormorant.variable} ${marcellus.variable} ${italiana.variable} ${tenor.variable} ${gilda.variable} min-h-screen bg-paper`}
    >
      <header className="border-b border-line bg-paper px-6 py-8 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Typeface comparison</p>
            <h1 className="mt-3 font-display text-[30px] font-light text-ink">
              Which heading font for TheONE?
            </h1>
            <p className="mt-3 max-w-xl text-[14px] leading-[1.7] text-ink-soft">
              The same hero, five times. Only the heading typeface changes —
              body text stays as it is. Compare each against the logo on the
              right, which is the letterform we are trying to match.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-line bg-paper-soft p-5">
            <Image
              src="/images/theone-lockup.png"
              alt="TheONE Super App logo"
              width={252}
              height={384}
              unoptimized
              className="h-[132px] w-auto"
            />
          </div>
        </div>
      </header>

      {CANDIDATES.map((candidate, index) => (
        <section key={candidate.name}>
          <div className="border-y border-line bg-ink px-6 py-3 lg:px-8">
            <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                Option {index + 1}
              </span>
              <span className="text-[17px] font-semibold text-white">
                {candidate.name}
              </span>
              <span className="text-[12.5px] text-white/65">
                {candidate.note}
              </span>
            </div>
          </div>

          {/* Pointing --font-display at this candidate re-faces every heading
              inside the hero without touching the hero itself. */}
          <div style={{ ["--font-display" as string]: `var(${candidate.variable})` }}>
            <HeroSection />
          </div>
        </section>
      ))}

      <footer className="border-t border-line px-6 py-12 text-center lg:px-8">
        <p className="text-[13px] text-ink-faint">
          Body text is unchanged throughout. Say which option you want and it
          goes in everywhere headings appear.
        </p>
      </footer>
    </div>
  );
}
