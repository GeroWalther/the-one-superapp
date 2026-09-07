/**
 * The light streams the storm throws off, and the figure that stands beside
 * it.
 *
 * Entirely decorative — the section states all of this in its copy — so the
 * whole assembly is hidden from assistive technology and the figure carries an
 * empty alt.
 */

import Image from "next/image";

const AQUA = "#4fb3bf";
const GOLD = "#b8914a";

/**
 * Where each stream is struck and when it fires. 0° is due right and angles
 * run clockwise; nothing sits near 90° or 270°, which is where the storm's own
 * brightest passages are.
 *
 * Icon chips used to sit at the end of each of these. They are gone; the
 * angles and delays are unchanged, so the lines run exactly as they did.
 */
type Stream = { angle: number; delay: number };

const STREAMS: Stream[] = [
  { angle: 160, delay: 0 },
  { angle: 180, delay: 0.5 },
  { angle: 200, delay: 1.0 },
  { angle: 138, delay: 1.5 },
  { angle: 220, delay: 2.0 },
  { angle: 120, delay: 2.5 },
  { angle: 20, delay: 0.3 },
  { angle: 0, delay: 0.8 },
  { angle: -20, delay: 1.3 },
  { angle: 42, delay: 1.8 },
  { angle: -42, delay: 2.3 },
  { angle: 60, delay: 2.8 },
];

/** How far past the storm's rim a stream reaches, as a share of its radius. */
const STREAM_RADIUS = 1.08;

function polar(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
}

/**
 * The light streams, drawn in the storm's own 0–200 coordinate space so they
 * can run from the eye out past its edge to each chip. The svg is set to
 * overflow visible, since the chips sit well outside the viewBox.
 */
export function VortexStreams() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="absolute inset-0 h-full w-full overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="vx-stream-out" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0" />
          <stop offset="50%" stopColor={GOLD} stopOpacity="0.9" />
          <stop offset="100%" stopColor={AQUA} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {STREAMS.map((stream) => {
        /* The storm's radius is 100 units in this viewBox, so a chip at
           CHIP_RADIUS of it lands at CHIP_RADIUS * 100 — scaling by the
           viewBox width instead put every stream at twice that distance and
           they overshot into open page. */
        const end = polar(stream.angle, STREAM_RADIUS * 100);
        /* Bowed, not straight: the control point is pushed off the chord so
           each stream curves the way the storm turns, which is what makes them
           look thrown off it rather than pinned to it. */
        const ctrl = polar(stream.angle - 26, 0.42 * 100);
        const d = `M100,100 Q${100 + ctrl.x},${100 + ctrl.y} ${100 + end.x},${100 + end.y}`;
        return (
          <g key={`${stream.angle}`}>
            <path
              d={d}
              fill="none"
              stroke={`${AQUA}33`}
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            <path
              d={d}
              fill="none"
              stroke="url(#vx-stream-out)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeDasharray="16 260"
              className="vx-stream"
              style={{ animationDelay: `${stream.delay}s` }}
            />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * The figure standing at the storm's lower left.
 *
 * Placed inside the storm's own box rather than beside it, so she scales with
 * it at every breakpoint and keeps her position on the disc instead of drifting
 * as the layout reflows.
 *
 * Not mirrored: the cut-out already faces right, which puts her looking into
 * the storm from this corner. Flipping her would turn her back on it — and
 * would mirror the shirt's placket and cuffs, which reads wrong on clothing.
 *
 * Decorative, so the alt is empty; the section makes its point in copy.
 */
export function VortexFigure() {
  return (
    <div
      aria-hidden="true"
      /* Bottom-aligned and pushed a little off the disc's edge, so she stands
         in front of the rim rather than floating on the dark. */
      className="pointer-events-none absolute bottom-[1%] left-[-4%] h-[58%] w-[34%] sm:h-[62%]"
    >
      <Image
        src="/images/frau.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 280px, 40vw"
        /* object-bottom so she stands on the same line however the box is
           sized; contain so the cut-out is never cropped or stretched. */
        className="object-contain object-bottom"
        /* Next's optimiser has been re-encoding this project's transparent
           PNGs to a palette whose alpha the browser ignores, which brings the
           background back — the same problem the masthead lockup hit. */
        unoptimized
      />
    </div>
  );
}
