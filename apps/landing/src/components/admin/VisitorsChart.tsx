"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Visitors per day as columns. Single series, so no legend: the card title
 * names it. Columns are capped at 24px with a 4px rounded top, hairline
 * gridlines, and a per-column tooltip; the table view below carries every
 * value for anyone who cannot use the hover.
 */
export function VisitorsChart({
  data,
  locale,
  labels,
}: {
  data: { day: string; visitors: number; visits: number }[];
  locale: string;
  labels: { visitors: string; visits: string; table: string; day: string };
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const height = 200;
  const pad = { top: 12, right: 8, bottom: 26, left: 36 };
  const plotW = Math.max(100, width - pad.left - pad.right);
  const plotH = height - pad.top - pad.bottom;

  const max = Math.max(1, ...data.map((d) => d.visitors));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);

  const band = plotW / data.length;
  const barW = Math.min(24, Math.max(2, band - 2));
  const y = (v: number) => pad.top + plotH - (v / top) * plotH;

  const format = (day: string, long = false) =>
    new Date(`${day}T12:00:00Z`).toLocaleDateString(locale, long ? { weekday: "short", day: "numeric", month: "short" } : { day: "numeric", month: "short" });
  // Label about six days across the axis, never every one.
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));
  const active = hover === null ? null : data[hover];

  return (
    <div>
      <div ref={wrap} className="relative">
        <svg width={width} height={height} role="img" aria-label={labels.visitors}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={pad.left} x2={pad.left + plotW} y1={y(tick)} y2={y(tick)} stroke="var(--line)" strokeWidth={1} />
              <text x={pad.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-ink-faint text-[11px] tabular-nums">
                {tick.toLocaleString(locale)}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const x = pad.left + i * band + (band - barW) / 2;
            const h = (d.visitors / top) * plotH;
            const r = Math.min(4, barW / 2, h);
            return (
              <g key={d.day}>
                {h > 0 && (
                  <path
                    d={roundedTop(x, y(d.visitors), barW, h, r)}
                    className={hover === i ? "fill-aqua-600" : "fill-aqua-500"}
                  />
                )}
                {i % labelEvery === 0 && (
                  <text x={x + barW / 2} y={height - 8} textAnchor="middle" className="fill-ink-faint text-[11px]">
                    {format(d.day)}
                  </text>
                )}
                {/* Hit target: the whole band, taller than the mark. */}
                <rect
                  x={pad.left + i * band}
                  y={pad.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>

        {active && hover !== null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px] shadow-md"
            style={{
              left: Math.min(Math.max(pad.left + hover * band + band / 2, 70), width - 70),
              top: Math.max(0, y(active.visitors) - 64),
            }}
          >
            <p className="font-medium text-ink">{format(active.day, true)}</p>
            <p className="mt-0.5 text-ink-soft tabular-nums">
              {active.visitors.toLocaleString(locale)} {labels.visitors} · {active.visits.toLocaleString(locale)} {labels.visits}
            </p>
          </div>
        )}
      </div>

      <details className="mt-3 text-[13px] text-ink-soft">
        <summary className="cursor-pointer select-none text-ink-faint hover:text-ink">{labels.table}</summary>
        <table className="mt-2 w-full max-w-md text-left tabular-nums">
          <thead>
            <tr className="text-ink-faint">
              <th className="py-1 font-normal">{labels.day}</th>
              <th className="py-1 text-right font-normal">{labels.visitors}</th>
              <th className="py-1 text-right font-normal">{labels.visits}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.day} className="border-t border-line">
                <td className="py-1">{format(d.day, true)}</td>
                <td className="py-1 text-right">{d.visitors.toLocaleString(locale)}</td>
                <td className="py-1 text-right">{d.visits.toLocaleString(locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/** Clean tick spacing: 1, 2, 5 × 10ⁿ, about four lines high. */
function niceStep(max: number): number {
  const raw = max / 4;
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / power;
  const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10;
  return Math.max(1, nice * power);
}

/** A column rounded at its data end and square at the baseline. */
function roundedTop(x: number, top: number, w: number, h: number, r: number): string {
  const bottom = top + h;
  return `M${x},${bottom} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${bottom} Z`;
}
