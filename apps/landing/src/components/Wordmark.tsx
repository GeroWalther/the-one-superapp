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
}: {
  href: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-3"
      aria-label="TheONE Super App"
    >
      {/* No ring or rounding: the icon supplies its own silhouette, and a
          rounded-rect outline at a different radius reads as a misfit box. */}
      <span className="relative block transition-transform duration-500 group-hover:scale-105">
        <Image
          src="/images/theone-icon.png"
          alt=""
          width={248}
          height={248}
          /* The icon cropped straight out of the hero lockup, so header and hero
             show the same artwork. The previous file had "TheONE SUPER APP"
             baked into it, which at 44px was an unreadable smudge sitting next
             to the same words set in live type. */
          style={{ width: compact ? 36 : 44, height: compact ? 36 : 44 }}
          priority
          // Same reason as the hero: optimising it flattens the alpha to white.
          unoptimized
          className="block"
        />
      </span>

      <span className="flex flex-col leading-none">
        <span className="font-display text-[20px] leading-none tracking-[0.04em] text-ink">
          <span className="font-light">The</span>
          <span className="font-semibold text-accent">ONE</span>
        </span>
        <span className="mt-[3px] text-[8px] font-semibold uppercase tracking-[0.3em] text-ink-faint">
          Super App
        </span>
      </span>
    </Link>
  );
}
