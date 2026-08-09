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
      <span className="relative block overflow-hidden rounded-[13px] ring-1 ring-line transition-transform duration-500 group-hover:scale-105">
        <Image
          src="/images/theone-logo.png"
          alt=""
          width={compact ? 36 : 44}
          height={compact ? 36 : 44}
          priority
          className="block"
        />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent to-aqua-500/15 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
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
