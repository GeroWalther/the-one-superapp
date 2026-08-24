/**
 * Marks where the mockup preview begins and ends.
 *
 * Without it the page reads as one very long site with two heroes, and whoever
 * is reviewing has to guess where one design stops. Loud on purpose — nothing
 * about it should survive a decision being made.
 */
export function PreviewDivider({ label }: { label: "start" | "end" }) {
  const text =
    label === "start"
      ? "▼  NEW DESIGN — mockup layout (preview)"
      : "▲  END OF PREVIEW  ·  ▼  CURRENT LIVE DESIGN BELOW";

  return (
    <div className="bg-ink px-6 py-2.5 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90">
        {text}
      </p>
    </div>
  );
}
