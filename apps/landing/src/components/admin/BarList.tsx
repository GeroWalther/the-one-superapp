/**
 * A ranked list with an inline magnitude bar. One hue, because the bars carry
 * size, not identity; the label and the number sit in ink beside them.
 */
export function BarList({
  title,
  rows,
  locale,
  empty,
  valueLabel,
}: {
  title: string;
  rows: { label: React.ReactNode; count: number; key: string }[];
  locale: string;
  empty: string;
  valueLabel: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <section className="glass-soft rounded-2xl px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        <span className="text-[12px] text-ink-faint">{valueLabel}</span>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-[15px] text-ink-faint">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {rows.map((row) => (
            <li key={row.key} className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-y-0 left-0 rounded-[4px] bg-aqua-100"
                style={{ width: `${(row.count / max) * 100}%` }}
              />
              <div className="relative flex items-center justify-between gap-3 px-2.5 py-1.5 text-[15px]">
                <span className="min-w-0 truncate text-ink">{row.label}</span>
                <span className="shrink-0 tabular-nums text-ink-soft">
                  {row.count.toLocaleString(locale)}
                  <span className="ml-2 inline-block w-10 text-right text-[12px] text-ink-faint">
                    {Math.round((row.count / total) * 100)}%
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
