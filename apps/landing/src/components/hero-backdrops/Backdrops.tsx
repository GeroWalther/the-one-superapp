/**
 * Hero backdrop treatments.
 *
 * Each one fills the hero and sits behind the content. They are deliberately
 * different in kind rather than in hue — a drafting grid, a contour map, a
 * neural mesh, a modular plan, an aurora — so the choice is about what the page
 * *is*, not which teal it uses.
 *
 * Two rules hold across all of them. The middle stays light, because the
 * headline and body are dark type and no backdrop is worth losing the page
 * over. And every one is pure CSS or inline SVG: no image requests, so they
 * cost nothing to load and scale to any viewport.
 */

const TEAL = "rgba(34,126,137,";

/* ── 1 · Blueprint ─────────────────────────────────────────────────────────
   Technical drafting: two grid scales, registration marks in the corners,
   dimension lines with arrowheads, and a setting-out circle. */
export function BlueprintBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#f7fafb]">
      {/* Fine grid, then a heavier one every fifth line, as on a drawing sheet. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${TEAL}0.13) 1px, transparent 1px),
            linear-gradient(90deg, ${TEAL}0.13) 1px, transparent 1px),
            linear-gradient(${TEAL}0.28) 1px, transparent 1px),
            linear-gradient(90deg, ${TEAL}0.28) 1px, transparent 1px)`,
          backgroundSize: "28px 28px, 28px 28px, 140px 140px, 140px 140px",
        }}
      />

      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 1440 900">
        <g stroke="rgba(34,126,137,0.5)" fill="none" strokeWidth="1.1">
          {/* Corner registration brackets */}
          <path d="M56,56 h58 M56,56 v58" />
          <path d="M1384,56 h-58 M1384,56 v58" />
          <path d="M56,844 h58 M56,844 v-58" />
          <path d="M1384,844 h-58 M1384,844 v-58" />
          {/* Setting-out circle and crosshair through the mark */}
          <circle cx="720" cy="330" r="196" strokeDasharray="7 9" opacity="0.55" />
          <circle cx="720" cy="330" r="264" strokeDasharray="2 12" opacity="0.35" />
          <path d="M720,42 v92 M720,526 v92 M432,330 h92 M916,330 h92" opacity="0.5" />
          {/* Dimension line with arrowheads and a tick scale */}
          <path d="M180,782 h1080" opacity="0.5" />
          <path d="M180,772 v20 M1260,772 v20" opacity="0.5" />
          <path d="M190,777 l-10,5 l10,5 M1250,777 l10,5 l-10,5" opacity="0.5" />
          {[...Array(19)].map((_, i) => (
            <path key={i} d={`M${180 + i * 60},782 v-8`} opacity="0.3" />
          ))}
        </g>
        <text x="180" y="812" fill="rgba(34,126,137,0.5)" fontSize="11" letterSpacing="3">
          DECISION INFRASTRUCTURE — SHEET 01
        </text>
      </svg>

      {/* Keeps the centre clear so the type never fights the drawing. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 46% 44% at 50% 40%, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.6) 45%, rgba(255,255,255,0) 72%)",
        }}
      />
    </div>
  );
}

/* ── 2 · Topographic ───────────────────────────────────────────────────────
   Nested contours, like a survey map. Calm, and it reads as "terrain being
   mapped" — which is close to what the product claims to do. */
export function TopographicBackdrop() {
  const rings = [...Array(13)];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#f6fafa]">
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 1440 900">
        <g fill="none" stroke="rgba(34,126,137,0.34)" strokeWidth="1.2">
          {rings.map((_, i) => {
            const k = i * 46;
            return (
              <path
                key={i}
                d={`M${-120 - k * 0.35},${300 + k * 0.5}
                    C ${300 - k * 0.2},${120 - k * 0.75} ${760 + k * 0.25},${420 + k * 0.5}
                      ${1120 + k * 0.4},${140 - k * 0.7}
                    S ${1520 + k * 0.3},${-40 - k * 0.5} ${1600 + k},${60 - k}`}
                opacity={0.9 - i * 0.055}
              />
            );
          })}
        </g>
      </svg>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 110% at 106% -10%, rgba(26,108,96,0.30) 0%, rgba(46,156,168,0.14) 40%, rgba(255,255,255,0) 74%), radial-gradient(ellipse 48% 46% at 50% 42%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 70%)",
        }}
      />
    </div>
  );
}

/* ── 3 · Neural mesh ───────────────────────────────────────────────────────
   Nodes and edges. The most literal nod to "a Power AI", and the only one that
   suggests a network rather than a surface. */
export function NeuralBackdrop() {
  const nodes = [
    [120, 140], [300, 90], [470, 190], [250, 300], [90, 380], [420, 420],
    [640, 120], [820, 240], [1010, 110], [1180, 260], [1330, 140], [1290, 400],
    [1100, 470], [900, 430], [700, 520], [500, 610], [300, 560], [140, 660],
    [1360, 620], [1180, 700], [980, 640], [780, 720], [560, 780], [340, 740],
  ];
  const edges = [
    [0,1],[1,2],[2,3],[3,4],[2,5],[5,3],[1,6],[6,7],[7,8],[8,9],[9,10],[9,11],
    [11,12],[12,13],[13,7],[13,14],[14,15],[15,16],[16,17],[14,5],[11,18],
    [18,19],[19,20],[20,12],[20,21],[21,22],[22,23],[23,16],[21,14],
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#f6fafb]">
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 1440 900">
        <g stroke="rgba(46,156,168,0.30)" strokeWidth="1">
          {edges.map(([a, b], i) => (
            <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />
          ))}
        </g>
        <g fill="rgba(34,126,137,0.55)">
          {nodes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 5 : 3} />
          ))}
        </g>
        <g fill="none" stroke="rgba(46,156,168,0.22)">
          {nodes.filter((_, i) => i % 5 === 0).map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="14" />
          ))}
        </g>
      </svg>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 92% 108% at 104% -10%, rgba(0,180,170,0.34) 0%, rgba(64,232,219,0.14) 42%, rgba(255,255,255,0) 76%), radial-gradient(ellipse 44% 44% at 50% 42%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%)",
        }}
      />
    </div>
  );
}

/* ── 4 · Modular plan ──────────────────────────────────────────────────────
   A chessboard of tinted cells at varying weights, like a site plan or a
   floor grid. The most architectural of the set. */
export function ModularBackdrop() {
  const cells = [
    [0,0,0.10],[2,0,0.05],[5,0,0.14],[9,0,0.06],[13,0,0.11],[16,0,0.05],
    [1,1,0.07],[4,1,0.12],[7,1,0.04],[11,1,0.09],[15,1,0.13],[18,1,0.06],
    [0,2,0.05],[3,2,0.10],[6,2,0.06],[10,2,0.13],[14,2,0.05],[17,2,0.10],
    [2,3,0.12],[5,3,0.05],[8,3,0.09],[12,3,0.06],[16,3,0.12],[19,3,0.07],
    [1,4,0.06],[4,4,0.11],[9,4,0.05],[13,4,0.10],[15,4,0.06],[18,4,0.12],
    [0,5,0.09],[3,5,0.05],[7,5,0.12],[11,5,0.06],[14,5,0.10],[17,5,0.05],
  ];
  const S = 80;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#f7fafa]">
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 1440 900">
        {cells.map(([cx, cy, o], i) => (
          <rect key={i} x={cx * S} y={cy * S + 60} width={S} height={S} fill={`rgba(34,126,137,${o})`} />
        ))}
        <g stroke="rgba(34,126,137,0.16)" strokeWidth="1">
          {[...Array(19)].map((_, i) => <line key={`v${i}`} x1={i * S} y1="0" x2={i * S} y2="900" />)}
          {[...Array(12)].map((_, i) => <line key={`h${i}`} x1="0" y1={i * S + 60} x2="1440" y2={i * S + 60} />)}
        </g>
      </svg>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 88% 100% at 105% -8%, rgba(19,84,74,0.42) 0%, rgba(42,138,124,0.18) 42%, rgba(255,255,255,0) 74%), radial-gradient(ellipse 46% 44% at 50% 42%, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0) 70%)",
        }}
      />
    </div>
  );
}

/* ── 5 · Aurora ribbons ────────────────────────────────────────────────────
   Wide bands of light sweeping the frame. The least technical and the most
   atmospheric — closest to the mockup's own background. */
export function AuroraBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#f5f9fa]">
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 1440 900">
        <defs>
          <linearGradient id="hb-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00c4ba" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#7ce0d4" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hb-b" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5ad0c0" stopOpacity="0.42" />
            <stop offset="70%" stopColor="#cfeee9" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 120, 250, 400].map((o, i) => (
          <path
            key={i}
            d={`M-160,${250 + o} C 340,${40 + o} 900,${540 + o} 1600,${120 + o}`}
            fill="none"
            stroke={i % 2 ? "url(#hb-b)" : "url(#hb-a)"}
            strokeWidth={i % 2 ? 150 : 190}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 46% 44% at 50% 42%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 70%)",
        }}
      />
    </div>
  );
}
