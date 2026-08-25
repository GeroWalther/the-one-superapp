import type { Metadata } from "next";
import { HeroSection } from "@/components/HeroSection";

/**
 * Corner-wash comparison for the client.
 *
 * The hero is rendered once per option, stacked, each pointing `--silk-corner`
 * at a different gradient. Nothing about the hero itself changes, so what is
 * being compared really is only the colour.
 *
 * Not linked from anywhere — a decision aid that should disappear once the
 * decision is made.
 */

export const metadata: Metadata = {
  title: "Hero colour options — TheONE",
  robots: { index: false, follow: false },
};

const OPTIONS = [
  {
    name: "1 · Deep petrol",
    note: "What is on the site now. Dark, green-leaning, restrained.",
    wash: `radial-gradient(
      ellipse 100% 115% at 108% -14%,
      rgba(12,58,50,0.90) 0%, rgba(19,84,74,0.72) 16%, rgba(26,108,96,0.52) 30%,
      rgba(42,138,124,0.32) 46%, rgba(95,180,165,0.16) 62%,
      rgba(198,228,220,0.06) 76%, rgba(255,255,255,0) 90%)`,
  },
  {
    name: "2 · Luminous teal",
    note: "Brighter and more saturated. The most alive of the set — reads as optimism rather than gravity.",
    wash: `radial-gradient(
      ellipse 105% 120% at 106% -12%,
      rgba(0,122,110,0.82) 0%, rgba(12,155,140,0.62) 18%, rgba(32,182,168,0.42) 34%,
      rgba(88,209,196,0.24) 52%, rgba(158,231,222,0.12) 70%,
      rgba(255,255,255,0) 88%)`,
  },
  {
    name: "3 · Emerald depth",
    note: "Darkest and greenest, with a brighter edge where it fades. Most serious of the three colour-forward options.",
    wash: `radial-gradient(
      ellipse 95% 112% at 108% -16%,
      rgba(6,46,38,0.94) 0%, rgba(11,74,62,0.78) 15%, rgba(17,104,86,0.56) 29%,
      rgba(34,146,124,0.34) 45%, rgba(96,192,172,0.18) 63%,
      rgba(198,232,224,0.06) 78%, rgba(255,255,255,0) 90%)`,
  },
  {
    name: "4 · Aurora",
    note: "Two tones — deep teal at the corner easing into mint. Softer and more atmospheric, less like a block of colour.",
    wash: `radial-gradient(
      ellipse 80% 95% at 100% -8%,
      rgba(13,90,88,0.80) 0%, rgba(26,132,124,0.52) 24%,
      rgba(72,186,170,0.30) 44%, rgba(255,255,255,0) 72%),
      radial-gradient(
      ellipse 70% 80% at 78% 10%,
      rgba(150,222,206,0.42) 0%, rgba(190,236,226,0.16) 45%,
      rgba(255,255,255,0) 74%)`,
  },
  {
    name: "5 · Diagonal sweep",
    note: "A band running across the corner rather than a glow in it. More graphic, more editorial.",
    wash: `linear-gradient(
      205deg,
      rgba(9,74,64,0.90) 0%, rgba(20,116,102,0.62) 14%, rgba(46,160,144,0.34) 26%,
      rgba(126,206,192,0.16) 38%, rgba(255,255,255,0) 52%)`,
  },
];

export default function HeroColourPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-paper px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow">Hero colour</p>
          <h1 className="mt-3 font-display text-[30px] font-light text-ink">
            Five options for the teal
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-[1.7] text-ink-soft">
            The same hero, five times. Only the colour in the top-right corner
            changes — everything else is identical, so what you are comparing is
            just the wash.
          </p>
        </div>
      </header>

      {OPTIONS.map((option) => (
        <section key={option.name}>
          <div className="border-y border-line bg-ink px-6 py-3 lg:px-8">
            <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-[17px] font-semibold text-white">
                {option.name}
              </span>
              <span className="text-[12.5px] text-white/65">{option.note}</span>
            </div>
          </div>

          <div style={{ ["--silk-corner" as string]: option.wash }}>
            <HeroSection />
          </div>
        </section>
      ))}

      <footer className="border-t border-line px-6 py-12 text-center lg:px-8">
        <p className="text-[13px] text-ink-faint">
          Tell me a number and it goes live everywhere the hero wash appears.
        </p>
      </footer>
    </div>
  );
}
