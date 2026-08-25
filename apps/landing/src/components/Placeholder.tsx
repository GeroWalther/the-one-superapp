import { ImageIcon } from "lucide-react";

/**
 * Stands in for photography that has not been supplied yet.
 *
 * Branded rather than grey: a client reviewing layout should be looking at the
 * composition, and a wall of grey boxes reads as "broken" while stock
 * photography reads as "finished". This reads as neither — clearly a slot
 * waiting for a picture, in the site's own colours.
 *
 * Fills its container, so it drops into any aspect the layout already sets.
 */
export function Placeholder({
  label,
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`absolute inset-0 grid place-items-center bg-aqua-100 ${className}`}
      aria-hidden="true"
    >
      {/* Faint diagonal hatching, so adjacent placeholders stay distinguishable
          from one flat block of colour. */}
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(46,156,168,0.10) 0 10px, transparent 10px 20px)",
        }}
      />
      <div className="relative flex flex-col items-center gap-2 px-4 text-center">
        <ImageIcon className="h-6 w-6 text-aqua-500/70" strokeWidth={1.3} />
        {label && (
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-aqua-700/80">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
