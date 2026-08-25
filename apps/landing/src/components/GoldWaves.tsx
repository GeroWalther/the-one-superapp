/**
 * Gold spiral arms sweeping the full height of the hero.
 *
 * The arms are real spirals — points plotted from `r = a + b·θ` about a centre
 * off to the upper right — rather than curves drawn to look like one. That is
 * what makes the rotation read as a vortex: every arm turns about the same
 * point, so the set winds instead of sliding.
 *
 * Two motions compose. The whole bundle rotates very slowly about the spiral's
 * centre, and each arm's dash pattern travels along its own length. Rotation
 * alone reads as a turning picture; flow alone reads as static lines with
 * moving highlights. Together they read as material moving through a spiral.
 */

const CX = 1180;
const CY = 250;
const ARMS = 20;

/** Plots one spiral arm as an SVG polyline path. */
function arm(index: number): string {
  const offset = (index / ARMS) * Math.PI * 2;
  const points: string[] = [];

  // Enough turns and reach to run past every edge of the 1440×900 frame.
  for (let t = 0; t <= 15.5; t += 0.14) {
    const r = 26 + 118 * t;
    const theta = t + offset;
    const x = CX + r * Math.cos(theta);
    // Squashed vertically so the arms stretch top-to-bottom rather than
    // circling tightly — a true circle would loop inside the frame.
    const y = CY + r * Math.sin(theta) * 0.82;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return `M${points.join(" L")}`;
}

const STRANDS = Array.from({ length: ARMS }, (_, i) => ({
  d: arm(i),
  width: i % 4 === 0 ? 3.2 : i % 3 === 0 ? 2.1 : 1.3,
  dash: 220 + (i % 5) * 130,
  gap: 260 + (i % 4) * 150,
  duration: 14 + (i % 6) * 5,
  delay: -(i * 2.3),
  stroke: i % 3 === 0 ? "url(#gw-bright)" : i % 3 === 1 ? "url(#gw-mid)" : "url(#gw-pale)",
}));

export function GoldWaves() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
      >
        <defs>
          <linearGradient id="gw-bright" x1="1" y1="0" x2="0.05" y2="0.9">
            <stop offset="0%" stopColor="#f6dda2" stopOpacity="1" />
            <stop offset="35%" stopColor="#d8ad5f" stopOpacity="0.95" />
            <stop offset="75%" stopColor="#c9a961" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#c9a961" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="gw-mid" x1="1" y1="0" x2="0.1" y2="0.95">
            <stop offset="0%" stopColor="#e9c887" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#c39a4d" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#c39a4d" stopOpacity="0.26" />
          </linearGradient>
          <linearGradient id="gw-pale" x1="1" y1="0" x2="0.15" y2="1">
            <stop offset="0%" stopColor="#fff1cf" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#eed9a6" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#eed9a6" stopOpacity="0.24" />
          </linearGradient>

          {/* White shows through a mask; black hides regardless of opacity — so
              this fades black at the centre out to white at the edges, keeping
              the arms off the type without hiding the whole layer. */}
          <radialGradient id="gw-clear" cx="0.44" cy="0.5" r="0.52">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="42%" stopColor="#2b2b2b" />
            <stop offset="100%" stopColor="#ffffff" />
          </radialGradient>
          <mask id="gw-mask">
            <rect width="1440" height="900" fill="url(#gw-clear)" />
          </mask>
        </defs>

        <g mask="url(#gw-mask)">
          {/* The vortex. Rotating about the spiral's own centre is what makes
              the arms wind rather than drift across the frame. */}
          <g
            className="gold-vortex"
            style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: "view-box" }}
          >
            {STRANDS.map((s, i) => (
              <path
                key={i}
                className="gold-strand"
                d={s.d}
                fill="none"
                strokeLinecap="round"
                stroke={s.stroke}
                strokeWidth={s.width}
                strokeDasharray={`${s.dash} ${s.gap}`}
                style={{
                  animationDuration: `${s.duration}s`,
                  animationDelay: `${s.delay}s`,
                  ["--flow-span" as string]: `${s.dash + s.gap}`,
                }}
              />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
