import { useTranslations } from "next-intl";
import { PhoneMockup } from "./PhoneMockup";

export function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="relative overflow-hidden bg-white pb-10 pt-24 sm:pt-28 lg:pb-14">
      {/* Background waves — prominent flowing teal curves to match design */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 800"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-200 560 C120 320, 520 640, 820 420 S1220 220, 1640 560 L1640 0 L-200 0 Z"
          fill="url(#heroFill)"
          opacity="0.12"
        />
        <path
          d="M-100 220 C200 120, 520 360, 840 240 S1200 100, 1600 300"
          stroke="url(#heroLine1)"
          strokeWidth="1.2"
          opacity="0.55"
        />
        <path
          d="M-100 300 C220 160, 540 440, 860 300 S1220 160, 1600 380"
          stroke="url(#heroLine2)"
          strokeWidth="1.2"
          opacity="0.45"
        />
        <path
          d="M-100 380 C240 220, 560 500, 880 360 S1240 220, 1600 460"
          stroke="url(#heroLine3)"
          strokeWidth="1.2"
          opacity="0.38"
        />
        <path
          d="M-100 460 C260 300, 580 560, 900 420 S1260 280, 1600 540"
          stroke="url(#heroLine4)"
          strokeWidth="1.2"
          opacity="0.28"
        />
        <path
          d="M-100 540 C280 380, 600 620, 920 480 S1280 340, 1600 620"
          stroke="url(#heroLine5)"
          strokeWidth="1.2"
          opacity="0.2"
        />
        <defs>
          <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b5d3d3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="heroLine1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7a9e9e" stopOpacity="0" />
            <stop offset="30%" stopColor="#7a9e9e" />
            <stop offset="70%" stopColor="#9cc1c1" />
            <stop offset="100%" stopColor="#7a9e9e" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="heroLine2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7a9e9e" stopOpacity="0" />
            <stop offset="30%" stopColor="#8fb5b5" />
            <stop offset="70%" stopColor="#b0d0d0" />
            <stop offset="100%" stopColor="#7a9e9e" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="heroLine3" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9cc1c1" stopOpacity="0" />
            <stop offset="40%" stopColor="#9cc1c1" />
            <stop offset="100%" stopColor="#9cc1c1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="heroLine4" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b0d0d0" stopOpacity="0" />
            <stop offset="50%" stopColor="#b0d0d0" />
            <stop offset="100%" stopColor="#b0d0d0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="heroLine5" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c8dede" stopOpacity="0" />
            <stop offset="50%" stopColor="#c8dede" />
            <stop offset="100%" stopColor="#c8dede" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-8">
          {/* Left: Text */}
          <div className="max-w-lg flex-1 text-center lg:text-left">
            <h1 className="font-display text-[34px] font-bold leading-[1.1] tracking-[-0.01em] text-[#1a1a2e] sm:text-[42px] lg:text-[48px]">
              {t("title")}
              <br />
              {t("titleHighlight")}
            </h1>
            <p className="mt-5 text-[14px] font-normal leading-relaxed text-[#8a8a8a] sm:text-[15px]">
              {t("subtitle")}
            </p>
            <div className="mt-8">
              <a href="#join" className="hero-cta-btn inline-block">
                <span className="hero-cta-btn__ring inline-block rounded-full p-[1.5px]">
                  <span className="hero-cta-btn__inner block rounded-full px-8 py-2 text-[15px] font-medium tracking-normal text-white transition-colors">
                    {t("cta")}
                  </span>
                </span>
              </a>
            </div>
          </div>

          {/* Right: Phone */}
          <div className="flex justify-center lg:flex-1 lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
