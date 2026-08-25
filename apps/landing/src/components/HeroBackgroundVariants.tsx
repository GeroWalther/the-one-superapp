import { HeroSection } from "./HeroSection";

/**
 * The hero repeated once per background treatment, for choosing between them.
 *
 * Each option only sets `--silk-corner`, so the heroes are otherwise identical
 * and what is being compared really is only the colour.
 *
 * All of them keep the middle of the hero light. The headline and the body copy
 * are dark type; pushing saturation across the centre would win on vividness
 * and lose on being able to read the page, so the colour lives at the edges and
 * the type keeps a clean ground.
 */

const OPTIONS = [
  {
    name: "A · Electric teal",
    note: "The brand teal pushed to full saturation. Vivid but still one colour — the safest of the lively options.",
    wash: `radial-gradient(ellipse 95% 115% at 106% -12%,
      rgba(0,180,170,0.85) 0%, rgba(16,214,199,0.55) 20%, rgba(64,232,219,0.34) 38%,
      rgba(146,245,235,0.18) 56%, rgba(216,252,248,0.07) 74%, rgba(255,255,255,0) 88%)`,
  },
  {
    name: "B · Aurora — teal to violet",
    note: "Teal in the corner easing into violet. The most 'AI product' of the set; adds a second hue to the brand.",
    wash: `radial-gradient(ellipse 78% 95% at 104% -10%,
        rgba(0,196,186,0.72) 0%, rgba(40,214,205,0.42) 26%, rgba(255,255,255,0) 66%),
      radial-gradient(ellipse 62% 78% at 74% 4%,
        rgba(124,92,255,0.42) 0%, rgba(164,140,255,0.22) 38%, rgba(255,255,255,0) 72%)`,
  },
  {
    name: "C · Neon mint",
    note: "Green-forward and bright. Lively and clean, closest to the app icon's own mint.",
    wash: `radial-gradient(ellipse 100% 118% at 106% -14%,
      rgba(0,168,124,0.80) 0%, rgba(24,214,158,0.52) 20%, rgba(94,240,190,0.32) 38%,
      rgba(168,250,220,0.16) 58%, rgba(225,254,244,0.06) 76%, rgba(255,255,255,0) 90%)`,
  },
  {
    name: "D · Deep tech",
    note: "Dark ink-teal corner with a bright cyan edge. Serious and technical rather than sunny.",
    wash: `radial-gradient(ellipse 92% 112% at 106% -14%,
      rgba(6,32,54,0.92) 0%, rgba(9,62,92,0.74) 14%, rgba(12,110,140,0.52) 28%,
      rgba(24,178,199,0.34) 44%, rgba(96,226,232,0.20) 60%,
      rgba(196,246,250,0.07) 78%, rgba(255,255,255,0) 90%)`,
  },
  {
    name: "E · Mesh",
    note: "Three light sources — cyan, mint, violet. The most vivid and the least conventional.",
    wash: `radial-gradient(ellipse 58% 70% at 102% -6%,
        rgba(0,208,196,0.72) 0%, rgba(255,255,255,0) 62%),
      radial-gradient(ellipse 52% 62% at 70% 8%,
        rgba(126,96,255,0.36) 0%, rgba(255,255,255,0) 66%),
      radial-gradient(ellipse 60% 66% at 88% 34%,
        rgba(30,232,178,0.34) 0%, rgba(255,255,255,0) 68%)`,
  },
];

export function HeroBackgroundVariants() {
  return (
    <div>
      <div className="bg-ink px-6 py-4 text-center lg:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white">
          Background comparison — the same hero, five times
        </p>
        <p className="mt-1 text-[12px] text-white/60">
          Only the colour changes. The centre stays light in all of them so the
          headline keeps a clean ground.
        </p>
      </div>

      {OPTIONS.map((option) => (
        <section key={option.name}>
          <div className="border-y border-line bg-paper-soft px-6 py-3 lg:px-8">
            <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-[16px] font-semibold text-ink">
                {option.name}
              </span>
              <span className="text-[12.5px] text-ink-soft">{option.note}</span>
            </div>
          </div>

          <div style={{ ["--silk-corner" as string]: option.wash }}>
            <HeroSection />
          </div>
        </section>
      ))}

      <div className="bg-ink px-6 py-4 text-center lg:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white">
          End of background comparison
        </p>
      </div>
    </div>
  );
}
