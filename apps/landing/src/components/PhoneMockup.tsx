import Image from "next/image";
import { Sparkles } from "lucide-react";

const cards = [
  {
    src: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=420&h=240&fit=crop&q=80",
    label: "Health & Longevity",
    tint: "#0f4a45",
  },
  {
    src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=420&h=240&fit=crop&q=80",
    label: "Wealth Management",
    tint: "#3d2c17",
  },
  {
    src: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=420&h=240&fit=crop&q=80",
    label: "Lifestyle Services",
    tint: "#1c3345",
  },
  {
    src: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=420&h=240&fit=crop&q=80",
    label: "Wellness & Resorts",
    tint: "#1f4536",
  },
];

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
          <div className="relative overflow-hidden rounded-[41px] bg-ink-800">
            {/* Screen glow + reflection */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(79,209,192,0.16),transparent_70%)]" />
            <div className="pointer-events-none absolute inset-0 z-20 rounded-[41px] bg-gradient-to-br from-white/12 via-transparent to-transparent opacity-60" />

            {/* Status bar + dynamic island */}
            <div className="relative flex h-10 items-center justify-center pt-2.5">
              <div className="h-[23px] w-[86px] rounded-full bg-black" />
              <span className="absolute left-5 top-3 text-[9.5px] font-medium text-mist">
                9:41
              </span>
              <div className="absolute right-5 top-[13px] flex items-center gap-[3px]">
                <div className="h-[7px] w-[9px] rounded-[1px] bg-mist/85" />
                <div className="h-[6px] w-[10px] rounded-[1px] bg-mist/85" />
                <div className="relative h-[7px] w-[14px] rounded-[2px] border border-mist/85">
                  <div className="absolute left-[1px] top-[1px] h-[3px] w-[8px] rounded-[1px] bg-mist/85" />
                </div>
              </div>
            </div>

            <div className="px-3.5 pb-3 pt-3">
              <p className="text-center font-display text-[15px] leading-none tracking-wide">
                <span className="font-light text-mist">The</span>
                <span className="text-gradient-gold font-semibold">ONE</span>
              </p>

              {/* AI prompt bar */}
              <div className="mt-3.5 flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2">
                <Sparkles
                  className="h-3 w-3 shrink-0 text-teal-400"
                  strokeWidth={1.8}
                />
                <span className="truncate text-[9px] text-mist-faint">
                  Which longevity clinic fits me?
                </span>
              </div>

              <div className="mt-2.5 space-y-2">
                {cards.map((card) => (
                  <div
                    key={card.label}
                    className="relative h-[74px] overflow-hidden rounded-[13px] ring-1 ring-white/8"
                  >
                    <Image
                      src={card.src}
                      alt=""
                      fill
                      sizes="240px"
                      className="object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(95deg, ${card.tint}f2 0%, ${card.tint}80 48%, transparent 92%)`,
                      }}
                    />
                    <p className="absolute bottom-2.5 left-3 text-[9.5px] font-semibold tracking-wide text-white drop-shadow">
                      {card.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex h-6 items-center justify-center pb-1.5">
              <div className="h-[4px] w-[96px] rounded-full bg-white/25" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
