import Image from "next/image";
import Link from "next/link";

/**
 * The wordmark, matching the app icon.
 *
 * "SUPER APP" is part of the mark, not decoration — it sits under "TheONE" on
 * the icon and has to travel with it everywhere the name appears.
 */
export function Wordmark({
  href,
  compact = false,
  large = false,
  tone = "dark",
}: {
  href: string;
  compact?: boolean;
  /** The footer's mark, a third bigger than the header's: it is a signature
      there rather than a navigation item, and at header size it read as a
      stray copy of the header. */
  large?: boolean;
  /** "light" is the mark on a dark ground — the footer. Ink on petrol is
      unreadable, so the type inverts; the icon carries its own alpha and
      needs no change. */
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-3"
      aria-label="TheONE Super App"
    >
      {/* On light grounds the bitmap supplies its own silhouette and needs no
          help. On the footer's dark ground it does: the artwork was cropped out
          of a lit composite, so its outer two or three pixels are a pale,
          half-transparent bevel that is invisible against white and reads as a
          soft grey fringe against petrol. Clipping to a rounded square of the
          same radius and pushing the bitmap 6% past the edge cuts that fringe
          off and lets the browser draw the silhouette, which is crisp at any
          size. */}
      <span
        className={`relative block transition-transform duration-500 group-hover:scale-105 ${
          large ? "overflow-hidden rounded-[22.5%]" : ""
        }`}
        style={large ? { width: 66, height: 66 } : undefined}
      >
        <Image
          src="/images/theone-icon.png"
          alt=""
          width={248}
          height={248}
          /* The icon cropped straight out of the hero lockup, so header and hero
             show the same artwork. The previous file had "TheONE SUPER APP"
             baked into it, which at 44px was an unreadable smudge sitting next
             to the same words set in live type. */
          style={
            large
              ? {
                  width: "106%",
                  height: "106%",
                  maxWidth: "none",
                  margin: "-3%",
                }
              : {
                  width: compact ? 36 : 44,
                  height: compact ? 36 : 44,
                }
          }
          priority
          // Same reason as the hero: optimising it flattens the alpha to white.
          unoptimized
          className="block"
        />
      </span>

      <span className="flex flex-col leading-none">
        <span
          className={`font-display leading-none tracking-[0.04em] ${
            large ? "text-[30px]" : "text-[20px]"
          } ${light ? "text-gold-gradient" : "text-ink"}`}
        >
          <span className="font-light">The</span>
          <span className={`font-semibold ${light ? "" : "text-accent"}`}>
            ONE
          </span>
        </span>
        <span
          className={`mt-[3px] font-semibold uppercase tracking-[0.3em] ${
            large ? "text-[11.5px]" : "text-[8px]"
          } ${light ? "text-gold-gradient" : "text-ink-faint"}`}
        >
          Super App
        </span>
      </span>
    </Link>
  );
}
