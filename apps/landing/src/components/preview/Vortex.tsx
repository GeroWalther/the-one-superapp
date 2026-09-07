/**
 * The vortex — a hurricane seen from above, carrying the section's headline.
 *
 * Bright at the eye, dark at the rim, turning with differential rotation: the
 * inner bands run a 9s period and the outermost 120s, and the shear between
 * them is what makes it read as one turning fluid rather than a spinning
 * picture. Nothing here rotates and scales on the same element — swell always
 * sits on a child of a spinner — so no animation fights another.
 *
 * The storm is decorative and hidden from assistive technology; the headline
 * and body over it are real text in the normal flow, so the section still
 * reads correctly with images off, at any zoom, and to a screen reader.
 */

import { VortexFigure, VortexStreams } from "./VortexFigures";

const BRAND = {
  aqua100: "#e6f3f5",
  aqua200: "#c2e2e7",
  aqua400: "#4fb3bf",
  aqua500: "#2e9ca8",
  aqua600: "#227e89",
  aqua700: "#1a626b",
  petrol900: "#004444",
  petrol500: "#005252",
  /* Below the token ramp on purpose: the rim needs to go darker than
     --petrol-900 to read as the storm's outer wall rather than as more band. */
  abyss: "#00252a",
  abyssDeep: "#001416",
  gold: "#b8914a",
  goldDeep: "#8a6420",
  goldBright: "#e6b849",
  goldLight: "#ffe9a8",
  ink: "#0a2f34",
};

/**
 * Deterministic pseudo-random, so the server and the client lay the debris out
 * identically. Math.random() here would hydrate to a different storm than it
 * rendered and React would throw a mismatch.
 */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/* Grains of debris, scattered across the disc and falling inward. Radius is
   square-rooted so they spread evenly over the *area* rather than bunching at
   the centre, which is what a plain uniform radius would do. */
const rand = seeded(20260907);
const DEBRIS = Array.from({ length: 90 }).map(() => {
  const angle = rand() * 360;
  const radius = 12 + Math.sqrt(rand()) * 38;
  return {
    angle,
    radius,
    size: 0.6 + rand() * 2.2,
    delay: -(rand() * 6.4),
    warm: rand() > 0.62,
    opacity: 0.25 + rand() * 0.6,
  };
});

/* The bands, outermost first. Each is a conic sweep on its own clock; the
   alpha climbs inward so the storm brightens toward the eye. */
const BANDS = [
  { inset: "0%", spin: "vx-spin-120", blur: "blur-2xl", opacity: 0.55 },
  { inset: "7%", spin: "vx-spin-72", blur: "blur-2xl", opacity: 0.65 },
  { inset: "15%", spin: "vx-spin-44", blur: "blur-xl", opacity: 0.7 },
  { inset: "24%", spin: "vx-spin-26", blur: "blur-xl", opacity: 0.8 },
  { inset: "33%", spin: "vx-spin-16", blur: "blur-lg", opacity: 0.85 },
  { inset: "41%", spin: "vx-spin-9", blur: "blur-md", opacity: 0.9 },
];

export function Vortex({ children }: { children?: React.ReactNode }) {
  return (
    <div
      /* left-1/2 + w-screen + -translate-x-1/2 escapes the max-w-3xl column
         this sits inside.
         overflow-x-clip, not overflow-hidden: the storm's blurs and shadows
         reach past its box on every side, and hidden clipped them into a flat
         edge across the top and bottom. Clipping one axis leaves the other
         visible, which hidden cannot do. */
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-x-clip"
    >
      {/* Figures either side, the storm between them. They drop away below xl:
          the chip ring now sits outside the rim, and under 1280px there is no
          room left for a figure beyond it. */}
      <div className="relative mx-auto flex w-full max-w-[1560px] items-center justify-center gap-0">
        <div className="hidden xl:block">
          <VortexFigure side="left" />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none relative aspect-square w-[min(78vw,780px)] shrink-0 select-none"
        >
        {/* 1 — the dark ground. It climbs from nothing at the eye to near-black
               at the wall and holds there, which is what makes the eye look lit
               from within rather than merely lighter. The last stop falls away
               over four percent only, so the storm has a hard outer edge. */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, transparent 24%, ${BRAND.petrol900}66 42%, ${BRAND.abyss}d9 62%, ${BRAND.abyssDeep}f2 80%, ${BRAND.abyssDeep}e6 92%, transparent 96%)`,
          }}
        />

        {/* 2 — the bands. Conic gradients with hard-edged stops, heavily
               blurred: the blur is what turns a pinwheel into cloud. Each
               swells on a child so the swell never fights the rotation. */}
        {BANDS.map((band, i) => (
          <div
            key={band.inset}
            className={`${band.spin} absolute rounded-full`}
            style={{ inset: band.inset }}
          >
            <div
              className={`vx-swell h-full w-full rounded-full ${band.blur}`}
              style={{
                animationDelay: `${-i * 1.9}s`,
                opacity: band.opacity,
                background: `conic-gradient(from ${i * 47}deg, transparent 0deg, ${
                  i > 3 ? BRAND.aqua200 : i > 1 ? BRAND.aqua600 : BRAND.abyss
                }cc 26deg, transparent 68deg, ${
                  i > 3 ? BRAND.goldLight : i > 1 ? BRAND.petrol500 : BRAND.abyssDeep
                }b3 122deg, transparent 168deg, ${
                  i > 1 ? BRAND.aqua400 : BRAND.petrol900
                }99 214deg, transparent 262deg, ${
                  i > 2 ? BRAND.goldBright : i > 1 ? BRAND.aqua700 : BRAND.abyss
                }80 308deg, transparent 356deg)`,
                /* Feathered to a ring: without this the conic reaches the
                   centre and fills the eye with spokes. */
                maskImage: `radial-gradient(circle, transparent 30%, #000 52%, #000 88%, transparent 97%)`,
                WebkitMaskImage: `radial-gradient(circle, transparent 30%, #000 52%, #000 88%, transparent 97%)`,
              }}
            />
          </div>
        ))}

        {/* 3 — spiral arms, drawn rather than swept, so the storm has actual
               structure under the cloud. Four logarithmic arms, each rotated a
               quarter turn from the last. */}
        <svg viewBox="0 0 200 200" className="vx-spin-44 absolute inset-[4%]">
          <defs>
            <linearGradient id="vx-arm" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={BRAND.goldLight} stopOpacity="0.9" />
              <stop offset="45%" stopColor={BRAND.aqua200} stopOpacity="0.5" />
              <stop offset="100%" stopColor={BRAND.petrol900} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 90, 180, 270].map((rot) => (
            <path
              key={rot}
              d={spiralPath()}
              fill="none"
              stroke="url(#vx-arm)"
              strokeWidth="6"
              strokeLinecap="round"
              transform={`rotate(${rot} 100 100)`}
            />
          ))}
        </svg>

        {/* 4 — sand haze drifting across the face, on a long odd period so it
               never syncs with the bands beneath it. */}
        <div
          className="vx-haze absolute inset-0 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(ellipse 60% 42% at 38% 42%, ${BRAND.goldLight}59, transparent 70%), radial-gradient(ellipse 46% 58% at 66% 60%, ${BRAND.aqua200}4d, transparent 68%)`,
          }}
        />

        {/* 5 — debris falling into the eye. Negative delays start every grain
               mid-flight, so the storm is already running on first paint
               instead of beginning with an empty disc. */}
        <div className="vx-spin-26 absolute inset-0">
          {DEBRIS.map((d, i) => (
            <span
              key={i}
              className="vx-infall absolute left-1/2 top-1/2 block rounded-full"
              style={{
                width: d.size,
                height: d.size,
                marginLeft: -d.size / 2,
                marginTop: -d.size / 2,
                transform: `rotate(${d.angle}deg) translateY(-${d.radius}%)`,
                background: d.warm ? BRAND.goldLight : BRAND.aqua100,
                opacity: d.opacity,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </div>

        {/* 6 — the eye wall: a tight bright ring right where the bands stop. */}
        <div
          className="vx-eye absolute inset-[40%] rounded-full"
          style={{
            boxShadow: `0 0 60px 14px ${BRAND.goldLight}80, 0 0 120px 40px ${BRAND.aqua200}66, inset 0 0 40px 10px #ffffff`,
            background: `radial-gradient(circle, #ffffff 0%, ${BRAND.goldLight}cc 42%, ${BRAND.aqua100}80 70%, transparent 84%)`,
          }}
        />

        {/* 7 — the wall. Drawn over the bands rather than under them, so the
               storm ends in a defined dark edge instead of dissolving: an
               inset shadow that bites in from the rim, plus two hairlines to
               give that edge an actual line to land on. */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `inset 0 0 90px 30px ${BRAND.abyssDeep}cc, inset 0 0 26px 4px ${BRAND.abyssDeep}`,
          }}
        />
        <div
          className="vx-spin-120 absolute inset-[1%] rounded-full border-2"
          style={{
            borderColor: `${BRAND.abyssDeep}b3`,
            boxShadow: `0 0 40px 6px ${BRAND.abyssDeep}59`,
          }}
        />
        <div
          className="absolute inset-[3%] rounded-full border"
          style={{ borderColor: `${BRAND.aqua700}4d` }}
        />

        {/* 8 — lightning in the wall: long dark, brief double-strike. */}
        <div
          className="vx-strike absolute inset-[34%] rounded-full blur-md"
          style={{
            background: `conic-gradient(from 210deg, transparent 0deg, #ffffff 18deg, transparent 40deg)`,
          }}
        />
        <div
          className="vx-strike absolute inset-[28%] rounded-full blur-lg"
          style={{
            animationDelay: "6.2s",
            background: `conic-gradient(from 40deg, transparent 0deg, ${BRAND.goldLight} 14deg, transparent 34deg)`,
          }}
        />
        {/* 9 — the streams flowing out past the rim. Outside the storm's own
               layers so the bands never blur over them. */}
        <VortexStreams />
        </div>

        <div className="hidden xl:block">
          <VortexFigure side="right" />
        </div>
      </div>

      {/* The label in the eye. Absolutely placed over the storm, so the eye's
          height decides where it lands rather than the flow. */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center px-6">
        {children}
      </div>
    </div>
  );
}

/**
 * One logarithmic arm, from just outside the eye to the rim.
 *
 * Sampled as a polyline rather than fitted with béziers: at 56 steps the
 * segments are far below a pixel at any size this renders, and the radius and
 * angle stay readable as the two numbers that actually shape the curve.
 */
function spiralPath() {
  const points: string[] = [];
  for (let i = 0; i <= 56; i++) {
    const t = i / 56;
    const angle = t * Math.PI * 1.75;
    const radius = 26 + t * 68;
    points.push(
      `${(100 + Math.cos(angle) * radius).toFixed(2)},${(100 + Math.sin(angle) * radius).toFixed(2)}`,
    );
  }
  return `M${points.join(" L")}`;
}
