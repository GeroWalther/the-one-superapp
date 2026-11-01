import Image from "next/image";
import { UserRound } from "lucide-react";
import { Vortex } from "@/components/preview/Vortex";

export function PhoneMockup() {
  return (
    <div className="relative w-[236px] sm:w-[252px] lg:w-[268px]">
      {/* Aura behind the device */}
      <div className="pointer-events-none absolute -inset-10 rounded-[70px] bg-[radial-gradient(circle_at_50%_45%,rgba(79,209,192,0.28),rgba(184,154,98,0.14)_45%,transparent_72%)] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 left-1/2 h-12 w-[68%] -translate-x-1/2 rounded-full bg-black/70 blur-2xl" />

      <div
        className="relative rounded-[46px] p-[3px]"
        style={{
          background:
            "linear-gradient(150deg, #6a6f72 0%, #23282b 22%, #0a0c0d 52%, #23282b 78%, #6a6f72 100%)",
          boxShadow:
            "0 40px 90px -24px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 0 rgba(255,255,255,0.18)",
        }}
      >
        {/* Side buttons */}
        <div className="absolute -left-[3px] top-[88px] h-[26px] w-[3px] rounded-l-sm bg-gradient-to-r from-[#3a3f42] to-[#0f1112]" />
        <div className="absolute -left-[3px] top-[128px] h-[48px] w-[3px] rounded-l-sm bg-gradient-to-r from-[#3a3f42] to-[#0f1112]" />
        <div className="absolute -left-[3px] top-[188px] h-[48px] w-[3px] rounded-l-sm bg-gradient-to-r from-[#3a3f42] to-[#0f1112]" />
        <div className="absolute -right-[3px] top-[152px] h-[66px] w-[3px] rounded-r-sm bg-gradient-to-l from-[#3a3f42] to-[#0f1112]" />

        <div className="rounded-[43px] bg-black p-[2px]">
          <div className="relative overflow-hidden rounded-[41px] bg-paper-soft">
            {/* Screen glow + reflection */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(79,209,192,0.16),transparent_70%)]" />
            <div className="pointer-events-none absolute inset-0 z-20 rounded-[41px] bg-gradient-to-br from-white/12 via-transparent to-transparent opacity-60" />

            {/* Status bar + dynamic island */}
            <div className="relative flex h-10 items-center justify-center pt-2.5">
              <div className="h-[23px] w-[86px] rounded-full bg-black" />
              <span className="absolute left-6 top-[13px] text-[10px] font-semibold tracking-tight text-[#0a0f12]">
                9:41
              </span>
              {/* iOS-style signal, Wi-Fi and battery glyphs. */}
              <div className="absolute right-[18px] top-[15px] flex items-center gap-[3px] text-[#0a0f12]">
                <svg width="13" height="8" viewBox="0 0 17 10" fill="currentColor" aria-hidden="true">
                  <rect x="0" y="7" width="3" height="3" rx="0.7" />
                  <rect x="4.5" y="5" width="3" height="5" rx="0.7" />
                  <rect x="9" y="2.5" width="3" height="7.5" rx="0.7" />
                  <rect x="13.5" y="0" width="3" height="10" rx="0.7" />
                </svg>
                <svg width="11" height="8" viewBox="0 0 15 11" fill="currentColor" aria-hidden="true">
                  <path d="M7.5 2.2c2.3 0 4.4.9 6 2.4l1.1-1.1A10 10 0 0 0 7.5.6 10 10 0 0 0 .4 3.5l1.1 1.1a8.5 8.5 0 0 1 6-2.4Z" />
                  <path d="M7.5 5.3c1.4 0 2.7.5 3.7 1.4l1.1-1.1a6.9 6.9 0 0 0-9.6 0l1.1 1.1c1-.9 2.3-1.4 3.7-1.4Z" />
                  <path d="M7.5 8.3c.6 0 1.1.2 1.5.6L7.5 10.5 6 8.9c.4-.4.9-.6 1.5-.6Z" />
                </svg>
                <svg width="19" height="9" viewBox="0 0 25 12" fill="none" aria-hidden="true">
                  <rect x="0.5" y="0.5" width="21" height="11" rx="3.2" stroke="currentColor" strokeOpacity="0.4" />
                  <rect x="2" y="2" width="18" height="8" rx="2" fill="currentColor" />
                  <path d="M23 4v4c.8-.3 1.3-1.1 1.3-2S23.8 4.3 23 4Z" fill="currentColor" fillOpacity="0.45" />
                </svg>
              </div>
            </div>

            <div className="relative px-3.5 pb-3 pt-3">
              {/* Profile avatar, top right: a filled disc in the vortex's
                  dark green with a white ring and soft shadow, the way a
                  signed-in avatar sits in a real app header. Decorative. */}
              <span
                aria-hidden="true"
                className="absolute right-3.5 top-3 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#1a626b] to-[#00252a] ring-2 ring-white shadow-[0_4px_10px_-3px_rgba(0,37,42,0.55)]"
              >
                <UserRound className="h-[15px] w-[15px] text-white" strokeWidth={1.8} />
              </span>
              {/* The full lockup (icon + "TheONE SUPER APP"), the same artwork
                  as the masthead. unoptimized for the same transparent-PNG
                  reason given there. */}
              <Image
                src="/images/theone-lockup-v4.png"
                alt=""
                width={533}
                height={677}
                unoptimized
                className="mx-auto h-[118px] w-auto"
              />

              {/* POWER AI storm with the figure, the same piece the page
                  shows below the wordmark, scaled to the screen. */}
              <p className="mt-4 text-center font-display text-[12px] font-bold uppercase leading-snug tracking-[0.08em] text-[#052226]">
                The Power AI
                <br />
                That Understands You
              </p>
              <div className="mt-5 pb-8">
                <Vortex contained>
                  <span className="font-display text-[13px] font-bold uppercase leading-none tracking-[0.2em] text-[#0a2f34]">
                    POWER AI
                  </span>
                </Vortex>
              </div>
            </div>

            <div className="flex h-6 items-center justify-center pb-1.5">
              <div className="h-[4px] w-[96px] rounded-full bg-paper-soft" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
