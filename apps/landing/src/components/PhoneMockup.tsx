export function PhoneMockup() {
  return (
    <div className="relative w-[210px] sm:w-[225px] lg:w-[240px]">
      {/* Deep soft ground shadow */}
      <div className="absolute -bottom-8 left-1/2 h-10 w-[70%] -translate-x-1/2 rounded-full bg-black/25 blur-2xl" />
      {/* Ambient glow shadow behind device */}
      <div className="absolute -inset-6 rounded-[55px] bg-gradient-to-br from-[#7a9e9e]/10 via-black/5 to-[#7a9e9e]/10 blur-2xl" />

      {/* Outer titanium-like frame */}
      <div
        className="relative rounded-[44px] p-[3px]"
        style={{
          background:
            "linear-gradient(145deg, #3a3a3c 0%, #1c1c1e 25%, #0a0a0a 55%, #1c1c1e 80%, #3a3a3c 100%)",
          boxShadow:
            "0 30px 80px -20px rgba(0,0,0,0.45), 0 15px 40px -10px rgba(0,0,0,0.3), inset 0 1px 0 0 rgba(255,255,255,0.12)",
        }}
      >
        {/* Side buttons — left */}
        <div className="absolute -left-[3px] top-[85px] h-[28px] w-[3px] rounded-l-sm bg-gradient-to-r from-[#2c2c2e] to-[#0f0f10]" />
        <div className="absolute -left-[3px] top-[125px] h-[50px] w-[3px] rounded-l-sm bg-gradient-to-r from-[#2c2c2e] to-[#0f0f10]" />
        <div className="absolute -left-[3px] top-[185px] h-[50px] w-[3px] rounded-l-sm bg-gradient-to-r from-[#2c2c2e] to-[#0f0f10]" />
        {/* Side button — right */}
        <div className="absolute -right-[3px] top-[150px] h-[68px] w-[3px] rounded-r-sm bg-gradient-to-l from-[#2c2c2e] to-[#0f0f10]" />

        {/* Inner bezel */}
        <div className="rounded-[41px] bg-black p-[2px]">
          {/* Screen */}
          <div className="relative overflow-hidden rounded-[39px] bg-white">
            {/* subtle screen reflection */}
            <div className="pointer-events-none absolute inset-0 z-10 rounded-[39px] bg-gradient-to-br from-white/50 via-transparent to-white/10 opacity-40 mix-blend-overlay" />

            {/* Dynamic Island */}
            <div className="relative flex h-9 items-center justify-center bg-white pt-2">
              <div className="h-[22px] w-[90px] rounded-full bg-[#0a0a0a]" />
              {/* Status bar time */}
              <span className="absolute left-4 top-2.5 text-[9px] font-semibold text-[#1a1a2e]">
                9:41
              </span>
              {/* Status bar icons */}
              <div className="absolute right-4 top-2.5 flex items-center gap-[3px]">
                <div className="h-[7px] w-[9px] rounded-[1px] bg-[#1a1a2e]" />
                <div className="h-[6px] w-[10px] rounded-[1px] bg-[#1a1a2e]" />
                <div className="relative h-[7px] w-[14px] rounded-[2px] border border-[#1a1a2e]">
                  <div className="absolute left-0 top-0 h-full w-[75%] rounded-[1px] bg-[#1a1a2e]" />
                </div>
              </div>
            </div>

            {/* App content */}
            <div className="px-3 pb-4 pt-4">
              {/* App logo */}
              <p className="mb-4 text-center text-[13px] tracking-wide text-[#1a1a2e]">
                <span className="font-light">The</span>
                <span className="font-bold">ONE</span>
              </p>

              {/* Category cards with real photos */}
              <div className="space-y-2.5">
                <CategoryCard
                  imageSrc="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&h=260&fit=crop"
                  label="Health & Longevity"
                  tintFrom="#3f6d6d"
                />
                <CategoryCard
                  imageSrc="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=260&fit=crop"
                  label="Wealth Management"
                  tintFrom="#4a3a2a"
                />
                <CategoryCard
                  imageSrc="https://images.unsplash.com/photo-1540541338287-41700207dee6?w=500&h=260&fit=crop"
                  label="Lifestyle Services"
                  tintFrom="#3a5567"
                />
                <CategoryCard
                  imageSrc="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&h=260&fit=crop"
                  label="Wellness & Resorts"
                  tintFrom="#4a6a5a"
                />
              </div>
            </div>

            {/* Home indicator */}
            <div className="flex h-6 items-center justify-center pb-1">
              <div className="h-[4px] w-[100px] rounded-full bg-black/25" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({
  imageSrc,
  label,
  tintFrom,
}: {
  imageSrc: string;
  label: string;
  tintFrom: string;
}) {
  return (
    <div className="relative h-[90px] overflow-hidden rounded-[14px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.15)]">
      <img
        src={imageSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(95deg, ${tintFrom}cc 0%, ${tintFrom}55 45%, transparent 85%)`,
        }}
      />
      <div className="absolute bottom-2.5 left-3">
        <p className="text-[10px] font-bold tracking-wide text-white drop-shadow-sm">
          {label}
        </p>
      </div>
    </div>
  );
}
