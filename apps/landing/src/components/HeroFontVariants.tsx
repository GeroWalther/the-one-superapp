import {
  Cormorant_Garamond,
  Gilda_Display,
  Italiana,
  Marcellus,
  Tenor_Sans,
} from "next/font/google";
import { HeroSection } from "./HeroSection";

/**
 * The hero repeated once per candidate heading typeface, for choosing between
 * them on the real headline at the real size rather than on a specimen line.
 *
 * Sits at the top of the landing page so it is the first thing seen, and
 * removing it is one line in page.tsx plus this file. Only the heading face
 * changes — body copy stays on Inter throughout.
 */

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--f-cormorant",
});
const marcellus = Marcellus({ subsets: ["latin"], weight: "400", variable: "--f-marcellus" });
const italiana = Italiana({ subsets: ["latin"], weight: "400", variable: "--f-italiana" });
const tenor = Tenor_Sans({ subsets: ["latin"], weight: "400", variable: "--f-tenor" });
const gilda = Gilda_Display({ subsets: ["latin"], weight: "400", variable: "--f-gilda" });

const CANDIDATES = [
  {
    name: "Cormorant Garamond",
    variable: "--f-cormorant",
    note: "Current. High contrast, angled calligraphic serifs — the least like the logo.",
  },
  {
    name: "Marcellus",
    variable: "--f-marcellus",
    note: "Closest structural match to the logo: low contrast, straight serifs.",
  },
  {
    name: "Italiana",
    variable: "--f-italiana",
    note: "Finest and airiest. Nearest the logo's hairline weight, most stylised.",
  },
  {
    name: "Tenor Sans",
    variable: "--f-tenor",
    note: "Barely serifed, nearly a sans. Cleanest and most modern.",
  },
  {
    name: "Gilda Display",
    variable: "--f-gilda",
    note: "Between Marcellus and Cormorant — warmer, a little more contrast.",
  },
];

export function HeroFontVariants() {
  return (
    <div
      className={`${cormorant.variable} ${marcellus.variable} ${italiana.variable} ${tenor.variable} ${gilda.variable}`}
    >
      <div className="bg-ink px-6 py-4 text-center lg:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white">
          Font comparison — the same hero, five times
        </p>
        <p className="mt-1 text-[12px] text-white/60">
          Only the heading typeface changes. Pick a number; the live page starts
          below option 5.
        </p>
      </div>

      {CANDIDATES.map((candidate, index) => (
        <section key={candidate.name}>
          <div className="border-y border-line bg-paper-soft px-6 py-3 lg:px-8">
            <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-aqua-700">
                Option {index + 1}
              </span>
              <span className="text-[16px] font-semibold text-ink">
                {candidate.name}
              </span>
              <span className="text-[12.5px] text-ink-soft">{candidate.note}</span>
            </div>
          </div>

          {/* Pointing --font-display at this candidate re-faces every heading in
              the hero without the hero knowing this page exists. */}
          <div style={{ ["--font-display" as string]: `var(${candidate.variable})` }}>
            <HeroSection />
          </div>
        </section>
      ))}

      <div className="bg-ink px-6 py-4 text-center lg:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white">
          End of font comparison — the live page follows
        </p>
      </div>
    </div>
  );
}
