/**
 * Fine gold filaments streaming from the top-right corner into the hero.
 *
 * Hairlines rather than ribbons, and they *flow* rather than drift: each strand
 * carries a long dash pattern whose offset animates, so the light travels along
 * the curve. Moving the whole shape instead would read as the picture sliding,
 * which is the thing that made the first version look like it was bobbing.
 *
 * Drawn, not an image — no request, sharp at any width. Strokes fade out before
 * the centre because the headline sits there, and gold behind dark type at full
 * strength is unreadable.
 */

/* Each strand is the same sweep, nudged and scaled, so the bundle stays coherent
   instead of looking like unrelated lines. */
const STRANDS = Array.from({ length: 16 }, (_, i) => {
  const spread = i * 34 - 250;
  const sag = i * 12;
  return {
    d: `M1620,${-220 + spread}
        C ${1240 + i * 6},${20 + spread + sag * 0.3}
          ${1000 - i * 4},${210 + spread + sag * 0.6}
          ${790 - i * 10},${400 + spread + sag}
        S ${430 - i * 12},${640 + spread + sag * 1.1}
          ${120 - i * 14},${730 + spread + sag * 1.2}`,
    width: i % 4 === 0 ? 2.1 : i % 3 === 0 ? 1.4 : 0.9,
    dash: 180 + (i % 5) * 90,
    gap: 140 + (i % 4) * 110,
    duration: 9 + (i % 6) * 3.5,
    delay: -(i * 1.7),
    stroke: i % 3 === 0 ? "url(#gw-bright)" : i % 3 === 1 ? "url(#gw-mid)" : "url(#gw-pale)",
  };
});

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
            <stop offset="75%" stopColor="#c9a961" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#c9a961" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gw-mid" x1="1" y1="0" x2="0.1" y2="0.95">
            <stop offset="0%" stopColor="#e9c887" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#c39a4d" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#c39a4d" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gw-pale" x1="1" y1="0" x2="0.15" y2="1">
            <stop offset="0%" stopColor="#fff1cf" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#eed9a6" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#eed9a6" stopOpacity="0" />
          </linearGradient>

          {/* White shows through a mask; black hides regardless of opacity — so
              this fades black at the centre out to white at the edges. */}
          <radialGradient id="gw-clear" cx="0.44" cy="0.52" r="0.5">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="52%" stopColor="#3d3d3d" />
            <stop offset="100%" stopColor="#ffffff" />
          </radialGradient>
          <mask id="gw-mask">
            <rect width="1440" height="900" fill="url(#gw-clear)" />
          </mask>
        </defs>

        <g mask="url(#gw-mask)" fill="none" strokeLinecap="round">
          {STRANDS.map((s, i) => (
            <path
              key={i}
              className="gold-strand"
              d={s.d}
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
      </svg>
    </div>
  );
}
