import { HeroSection } from "./HeroSection";
import {
  AuroraBackdrop,
  BlueprintBackdrop,
  ModularBackdrop,
  NeuralBackdrop,
  TopographicBackdrop,
} from "./hero-backdrops/Backdrops";

/**
 * Five hero treatments that differ in kind, not just in hue.
 *
 * The colour comparison above answers "which teal". This one answers a larger
 * question — what the page should feel like — so the options are a drafting
 * sheet, a survey map, a network, a site plan and a light field rather than
 * five gradients.
 *
 * Removing it is one line in page.tsx plus this file and Backdrops.tsx.
 */

const DESIGNS = [
  {
    name: "I · Blueprint",
    note: "Technical drafting sheet: two grid scales, registration marks, a dimension line and a setting-out circle around the mark. Says engineering and precision.",
    backdrop: <BlueprintBackdrop />,
  },
  {
    name: "II · Topographic",
    note: "Survey contours sweeping the frame. Calm, and it reads as terrain being mapped — close to what the product actually claims to do.",
    backdrop: <TopographicBackdrop />,
  },
  {
    name: "III · Neural mesh",
    note: "Nodes and edges. The most literal nod to the Power AI, and the only one that suggests a network rather than a surface.",
    backdrop: <NeuralBackdrop />,
  },
  {
    name: "IV · Modular plan",
    note: "A chessboard of tinted cells over a site grid. The most architectural, and the quietest of the graphic options.",
    backdrop: <ModularBackdrop />,
  },
  {
    name: "V · Aurora ribbons",
    note: "Wide bands of light across the frame. Least technical, most atmospheric — closest to the original mockup.",
    backdrop: <AuroraBackdrop />,
  },
];

export function HeroDesignVariants() {
  return (
    <div>
      <div className="bg-ink px-6 py-4 text-center lg:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white">
          Design comparison — five hero treatments
        </p>
        <p className="mt-1 text-[12px] text-white/60">
          Not five gradients: a drafting sheet, a survey map, a network, a site
          plan, a light field. All pure CSS and SVG — no image requests.
        </p>
      </div>

      {DESIGNS.map((design) => (
        <section key={design.name}>
          <div className="border-y border-line bg-paper-soft px-6 py-3 lg:px-8">
            <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-[16px] font-semibold text-ink">
                {design.name}
              </span>
              <span className="text-[12.5px] text-ink-soft">{design.note}</span>
            </div>
          </div>

          <HeroSection backdrop={design.backdrop} />
        </section>
      ))}

      <div className="bg-ink px-6 py-4 text-center lg:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white">
          End of design comparison
        </p>
      </div>
    </div>
  );
}
