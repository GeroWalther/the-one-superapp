/**
 * A raffle drum for the giveaway panel: a petrol drum with a mirror-gold rim
 * on a stand, white, gold, petrol and bordeaux tickets tumbling behind a glass
 * window.
 *
 * Only the window's contents turn (for visitors who have not asked for reduced
 * motion), so the frame, stand and crank stay put and it reads as tickets
 * being mixed. Decorative: the panel says everything in its copy.
 */

const CX = 160;
const CY = 112;

const PETROL = "#004444";
const PETROL_MID = "#005252";
const PETROL_LIGHT = "#1a626b";
/* The mirror gold of the footer's "TheONE SUPER APP" (.text-gold-gradient):
   GOLD paints through that gradient, GOLD_DEEP is its darkest stop for the
   fine lines a gradient would wash out. */
const GOLD = "url(#td-gold)";
const GOLD_DEEP = "#b8914a";
const BORDEAUX = "#6d1a2b";
const LIGHT_PETROL = "#bfe0e0";

/** Points of an octagon of radius r around (cx, cy), flat sides top and bottom. */
function octagon(r: number, cx = CX, cy = CY) {
  return Array.from({ length: 8 }, (_, k) => {
    const a = ((22.5 + 45 * k) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

type Ticket = {
  x: number;
  y: number;
  r: number;
  tone: "white" | "gold" | "petrol" | "bordeaux";
};

/* Tickets tumbling inside the window. */
const TICKETS: Ticket[] = [
  { x: 128, y: 82, r: -18, tone: "white" },
  { x: 170, y: 70, r: 24, tone: "gold" },
  { x: 196, y: 112, r: -32, tone: "bordeaux" },
  { x: 140, y: 140, r: 14, tone: "white" },
  { x: 176, y: 146, r: -50, tone: "gold" },
  { x: 116, y: 116, r: -64, tone: "petrol" },
  { x: 158, y: 104, r: 58, tone: "bordeaux" },
];

/* Balls among the tickets. */
const BALLS = [
  { x: 150, y: 70, r: 8, fill: GOLD },
  { x: 198, y: 86, r: 7, fill: "#ffffff" },
  { x: 120, y: 98, r: 6.5, fill: BORDEAUX },
  { x: 196, y: 140, r: 7.5, fill: "#ffffff" },
  { x: 156, y: 160, r: 6, fill: GOLD },
];

const TICKET_FILL = { white: "#ffffff", gold: GOLD, petrol: PETROL_MID, bordeaux: BORDEAUX } as const;
const TICKET_LINE = { white: GOLD_DEEP, gold: "#ffffff", petrol: "#ffffff", bordeaux: "#ffffff" } as const;

function TicketShape({ x, y, r, tone, w = 30, h = 16 }: Ticket & { w?: number; h?: number }) {
  return (
    <g transform={`rotate(${r} ${x} ${y})`}>
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={3}
        fill={TICKET_FILL[tone]}
        stroke={tone === "white" ? GOLD_DEEP : "none"}
        strokeWidth={1.2}
      />
      <line
        x1={x - w / 2 + 9}
        y1={y - h / 2 + 2}
        x2={x - w / 2 + 9}
        y2={y + h / 2 - 2}
        stroke={TICKET_LINE[tone]}
        strokeWidth={1.3}
        strokeDasharray="2 2"
      />
    </g>
  );
}

/** A four-pointed sparkle. */
function Sparkle({ x, y, s = 8, fill = GOLD }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <path
      d={`M${x},${y - s} Q${x},${y} ${x + s},${y} Q${x},${y} ${x},${y + s} Q${x},${y} ${x - s},${y} Q${x},${y} ${x},${y - s}Z`}
      fill={fill}
    />
  );
}

export function TombolaDrum({
  className = "",
  width = 360,
  onDark = false,
}: {
  className?: string;
  width?: number;
  /** On a dark petrol ground: stand, depth and accents switch to light petrol. */
  onDark?: boolean;
}) {
  const stand = onDark ? LIGHT_PETROL : PETROL;
  const accent = onDark ? LIGHT_PETROL : PETROL_LIGHT;
  return (
    <svg
      viewBox="0 0 320 264"
      width={width}
      height={(width * 264) / 320}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="td-drum" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={PETROL_LIGHT} />
          <stop offset="100%" stopColor={PETROL} />
        </linearGradient>
        <linearGradient id="td-gold" x1="0" y1="0" x2="1" y2="0.18">
          <stop offset="0%" stopColor="#b8914a" />
          <stop offset="45%" stopColor="#e3bf72" />
          <stop offset="100%" stopColor="#f2dda4" />
        </linearGradient>
        <radialGradient id="td-glass" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#d6e6e6" stopOpacity="0.9" />
        </radialGradient>
        <clipPath id="td-window">
          <polygon points={octagon(66)} />
        </clipPath>
      </defs>

      {/* Ground shadow. */}
      <ellipse cx={CX} cy={252} rx={104} ry={7} fill={onDark ? "#000000" : PETROL} opacity={onDark ? 0.25 : 0.14} />

      {/* Stand: two legs into a base with a gold trim. */}
      <path d="M130,188 L102,240 M190,188 L218,240" stroke={stand} strokeWidth={9} strokeLinecap="round" />
      <rect x={74} y={236} width={172} height={14} rx={7} fill={stand} />
      <rect x={84} y={236} width={152} height={3} rx={1.5} fill={GOLD} />

      {/* Back face, offset up and right, for depth. */}
      <polygon
        points={octagon(86, CX + 9, CY - 7)}
        fill={onDark ? LIGHT_PETROL : PETROL}
        opacity={onDark ? 0.3 : 0.55}
      />

      {/* Front face: petrol drum, gold rim. */}
      <polygon points={octagon(86)} fill="url(#td-drum)" stroke="url(#td-gold)" strokeWidth={6} strokeLinejoin="round" />

      {/* Glass window with the tickets turning behind it. */}
      <polygon points={octagon(66)} fill="url(#td-glass)" stroke={GOLD} strokeWidth={2} />
      <g clipPath="url(#td-window)">
        <g
          className="motion-safe:animate-[spin_22s_linear_infinite]"
          style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: "view-box" }}
        >
          <g stroke={PETROL_LIGHT} strokeWidth={1} opacity={0.25}>
            <line x1={CX - 70} y1={CY} x2={CX + 70} y2={CY} />
            <line x1={CX} y1={CY - 70} x2={CX} y2={CY + 70} />
            <line x1={CX - 50} y1={CY - 50} x2={CX + 50} y2={CY + 50} />
            <line x1={CX - 50} y1={CY + 50} x2={CX + 50} y2={CY - 50} />
          </g>
          {TICKETS.map((t) => (
            <TicketShape key={`${t.x}-${t.y}`} {...t} />
          ))}
          {BALLS.map((b) => (
            <g key={`${b.x}-${b.y}`}>
              <circle cx={b.x} cy={b.y} r={b.r} fill={b.fill} stroke={b.fill === "#ffffff" ? GOLD : "none"} strokeWidth={1} />
              <circle cx={b.x - b.r * 0.35} cy={b.y - b.r * 0.35} r={b.r * 0.3} fill="#ffffff" opacity={0.7} />
            </g>
          ))}
        </g>
      </g>
      {/* Glass highlight. */}
      <path d={`M${CX - 44},${CY - 40} Q${CX - 20},${CY - 60} ${CX + 14},${CY - 58}`} stroke="#ffffff" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.8} />

      {/* Rivets on the rim. */}
      {octagon(76)
        .split(" ")
        .map((p) => {
          const [x, y] = p.split(",").map(Number);
          return <circle key={p} cx={x} cy={y} r={2.6} fill={GOLD} />;
        })}

      {/* Hub. */}
      <circle cx={CX} cy={CY} r={11} fill="url(#td-gold)" />
      <circle cx={CX} cy={CY} r={4.5} fill={PETROL} />

      {/* Crank: gold arm from the rim, white handle. */}
      <path d={`M${CX + 80},${CY} L268,${CY} L268,${CY + 30}`} stroke="url(#td-gold)" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x={259} y={CY + 28} width={18} height={30} rx={9} fill="#ffffff" stroke={GOLD} strokeWidth={2} />

      {/* Tickets already drawn, at the foot of the stand. */}
      <TicketShape x={46} y={226} r={-12} tone="white" w={40} h={21} />
      <TicketShape x={56} y={204} r={8} tone="gold" w={36} h={19} />
      <TicketShape x={276} y={228} r={14} tone="bordeaux" w={38} h={20} />

      {/* Sparkles. */}
      <Sparkle x={44} y={58} s={9} />
      <Sparkle x={70} y={30} s={5} fill={accent} />
      <Sparkle x={282} y={44} s={10} />
      <Sparkle x={300} y={150} s={6} fill={accent} />
      <Sparkle x={26} y={150} s={6} />
    </svg>
  );
}
