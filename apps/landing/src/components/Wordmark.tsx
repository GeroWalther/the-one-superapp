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
          src="/images/theone-icon-v2.png"
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

      {light ? (
        /* Footer: the same lettering as the header (the wordmark cut from
           the hero lockup, "SUPER APP" centred under "TheONE"), never re-set
           in a font. The artwork is used as a mask so it can take the gold
           gradient on the dark ground. */
        <span
          aria-hidden="true"
          className={`block aspect-[397/146] bg-[linear-gradient(100deg,#b8914a_0%,#e3bf72_45%,#f2dda4_100%)] [mask-image:url(/images/theone-wordmark.png)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] ${
            large ? "h-[52px]" : "h-[34px]"
          }`}
        />
      ) : (
        /* Header: the wordmark cut from the hero lockup itself, so the name
           next to the icon is the exact same lettering as the logo. */
        <Image
          src="/images/theone-wordmark.png"
          alt=""
          width={397}
          height={146}
          unoptimized
          priority
          /* Smaller on phones so logo, language switch and menu fit in one
             row at 375px without pushing the menu off screen. */
          className={`block w-auto ${compact ? "h-[26px] sm:h-[30px]" : "h-[26px] sm:h-[34px]"}`}
        />
      )}
    </Link>
  );
}
