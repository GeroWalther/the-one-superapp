/**
 * The chips the storm throws off, the streams they ride, and the figure that
 * stands beside it.
 *
 * Entirely decorative — the section states all of this in its copy — so the
 * whole assembly is hidden from assistive technology and the figure carries an
 * empty alt.
 */

import Image from "next/image";
import {
  BedDouble,
  Briefcase,
  Building2,
  Heart,
  Home,
  Leaf,
  Plane,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  UserRound,
  type LucideIcon,
} from "lucide-react";

const PETROL = "#004444";
const AQUA = "#4fb3bf";
const GOLD = "#b8914a";

/**
 * The chips, placed by angle around the storm. 0° is due right and angles run
 * clockwise; nothing sits near 90° or 270°, which is where the storm's own
 * brightest passages are.
 *
 * Everything flows outward: these are what the AI returns, thrown off the eye
 * and out past the rim. The warm ring is the matched world — houses, clinics,
 * hotels — and the cool ring the life it is matched to.
 */
type Chip = {
  angle: number;
  icon: LucideIcon;
  /** Warm chips are the matched services, cool ones the life around them. */
  warm: boolean;
  size: number;
  delay: number;
};

const CHIPS: Chip[] = [
  { angle: 160, icon: UserRound, warm: false, size: 44, delay: 0 },
  { angle: 180, icon: Heart, warm: false, size: 38, delay: 0.5 },
  { angle: 200, icon: Target, warm: false, size: 36, delay: 1.0 },
  { angle: 138, icon: Leaf, warm: false, size: 36, delay: 1.5 },
  { angle: 220, icon: Briefcase, warm: false, size: 38, delay: 2.0 },
  { angle: 120, icon: Plane, warm: false, size: 34, delay: 2.5 },
  { angle: 20, icon: Building2, warm: true, size: 48, delay: 0.3 },
  { angle: 0, icon: Stethoscope, warm: true, size: 44, delay: 0.8 },
  { angle: -20, icon: BedDouble, warm: true, size: 46, delay: 1.3 },
  { angle: 42, icon: Home, warm: true, size: 42, delay: 1.8 },
  { angle: -42, icon: Sparkles, warm: true, size: 38, delay: 2.3 },
  { angle: 60, icon: ShieldCheck, warm: true, size: 36, delay: 2.8 },
];

/**
 * Where a chip sits, as a share of the storm's radius. Past 1, so the ring
 * clears the rim: inside it the chips read as buttons stuck to the disc rather
 * than as things the storm has thrown off.
 */
const CHIP_RADIUS = 1.08;

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

      {CHIPS.map((chip) => {
        /* The storm's radius is 100 units in this viewBox, so a chip at
           CHIP_RADIUS of it lands at CHIP_RADIUS * 100 — scaling by the
           viewBox width instead put every stream at twice the chip's
           distance, and they overshot into open page. */
        const end = polar(chip.angle, CHIP_RADIUS * 100);
        /* Bowed, not straight: the control point is pushed off the chord so
           each stream curves the way the storm turns, which is what makes them
           look thrown off it rather than pinned to it. */
        const ctrl = polar(chip.angle - 26, 0.42 * 100);
        const d = `M100,100 Q${100 + ctrl.x},${100 + ctrl.y} ${100 + end.x},${100 + end.y}`;
        return (
          <g key={`${chip.angle}`}>
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
              style={{ animationDelay: `${chip.delay}s` }}
            />
          </g>
        );
      })}
    </svg>
  );
}

/** The chips themselves, positioned on the same polar ring as the streams. */
export function VortexChips() {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      {CHIPS.map((chip) => {
        const { x, y } = polar(chip.angle, CHIP_RADIUS * 50);
        const Icon = chip.icon;
        return (
          <div
            key={chip.angle}
            className="absolute"
            style={{
              left: `calc(50% + ${x}%)`,
              top: `calc(50% + ${y}%)`,
              width: chip.size,
              height: chip.size,
              marginLeft: -chip.size / 2,
              marginTop: -chip.size / 2,
            }}
          >
            {/* Two nested animations: the chip arrives once, then floats
                forever. Splitting them keeps the arrival easing intact
                instead of being overwritten by the loop. */}
            <div
              className="vx-chip-in h-full w-full"
              style={{ animationDelay: `${chip.delay}s` }}
            >
              <div
                className="vx-chip-float grid h-full w-full place-items-center rounded-full border backdrop-blur-sm"
                style={{
                  animationDelay: `${-chip.delay}s`,
                  borderColor: chip.warm ? `${GOLD}80` : `${AQUA}80`,
                  background: "rgba(255,255,255,0.92)",
                  boxShadow: chip.warm
                    ? `0 10px 26px -12px ${PETROL}, 0 0 20px -6px ${GOLD}`
                    : `0 8px 22px -12px ${PETROL}, 0 0 16px -8px ${AQUA}`,
                }}
              >
                <Icon
                  strokeWidth={1.5}
                  style={{
                    width: chip.size * 0.42,
                    height: chip.size * 0.42,
                    color: chip.warm ? "#8a6420" : "#227e89",
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The figure standing beside the storm.
 *
 * Drawn silhouettes were here and have been removed: at this size a flat shape
 * reads as clip-art next to a storm with this much depth, and no amount of
 * path work fixes that — the section needs a photograph.
 *
 * So this renders a real image and nothing else. Drop a cut-out into
 * public/images (transparent PNG or WebP, roughly 2:5 portrait, the figure
 * turned toward the storm) and point FIGURE_SRC at it; until then the
 * component renders nothing rather than a broken image or a placeholder box.
 */
const FIGURE_SRC: string | null = null;

export function VortexFigure({ side }: { side: "left" | "right" }) {
  if (!FIGURE_SRC) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative h-[clamp(220px,30vw,420px)] w-[clamp(90px,13vw,180px)] shrink-0"
      /* Mirrored on the right so one asset serves both sides and the figure
         always faces the storm. Drop the flip if the artwork is directional
         — a suit's buttons and pocket square give a mirror away. */
      style={{ transform: side === "right" ? "scaleX(-1)" : undefined }}
    >
      <Image
        src={FIGURE_SRC}
        alt=""
        fill
        sizes="(min-width: 1280px) 180px, 0px"
        className="object-contain object-bottom"
        /* The cut-out needs its own alpha honoured; Next's optimiser has been
           re-encoding transparent PNGs on this project and bringing the white
           background back (see the lockup in the masthead). */
        unoptimized
      />
    </div>
  );
}
