import Image from "next/image";

/**
 * App icon with the "TheONE / SUPER APP" wordmark set as live text, so the
 * wordmark is the same Cormorant Garamond "The" light + "ONE" regular as the
 * TheONE above "YOUR WORLD UNDERSTOOD", instead of the different face baked
 * into theone-lockup-v4.png.
 *
 * Sizes are fixed per placement: `hero` for the masthead, `phone` for the
 * small one inside the phone mockup.
 */
const SIZES = {
  hero: {
    icon: "h-[150px] w-[150px] lg:h-[180px] lg:w-[180px]",
    mark: "mt-3 text-[46px] lg:text-[54px]",
    sub: "mt-1 text-[11px] tracking-[0.34em] lg:text-[13px]",
  },
  phone: {
    icon: "h-[80px] w-[80px]",
    mark: "mt-1.5 text-[24px]",
    sub: "mt-0.5 text-[7px] tracking-[0.32em]",
  },
} as const;

export function TheOneLockup({
  size,
  priority = false,
  alt = "",
}: {
  size: keyof typeof SIZES;
  priority?: boolean;
  alt?: string;
}) {
  const s = SIZES[size];
  return (
    <div className="flex flex-col items-center text-center" role={alt ? "img" : undefined} aria-label={alt || undefined}>
      <Image
        src="/images/theone-icon-v2.png"
        alt=""
        width={256}
        height={256}
        priority={priority}
        /* Transparent PNG served as-is: Next's optimiser would bring back a
           white background (same reason as the old lockup). */
        unoptimized
        className={`${s.icon} drop-shadow-[0_10px_18px_rgba(0,37,42,0.25)]`}
      />
      <p aria-hidden="true" className={`font-display font-light leading-none text-ink ${s.mark}`}>
        The<span className="font-normal">ONE</span>
      </p>
      <p aria-hidden="true" className={`font-sans uppercase text-ink/80 ${s.sub}`}>
        Super App
      </p>
    </div>
  );
}
