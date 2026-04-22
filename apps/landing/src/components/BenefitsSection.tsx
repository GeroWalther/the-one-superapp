import { useTranslations } from "next-intl";

export function BenefitsSection() {
  const t = useTranslations("benefits");

  return (
    <section id="benefits" className="bg-white pb-14 pt-4 sm:pb-16 sm:pt-6">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        {/* Title — mixed serif italic + sans to match mock */}
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="font-display text-[26px] font-medium leading-tight text-[#1a1a2e] sm:text-[30px]">
            {t.rich("title", {
              em: (chunks) => (
                <em className="italic font-normal">{chunks}</em>
              ),
              strong: (chunks) => (
                <span className="font-semibold">{chunks}</span>
              ),
            })}
          </h2>
          <p className="mt-3 text-[13px] text-[#9a9a9a] sm:text-[14px]">
            {t("subtitle")}
          </p>
        </div>

        {/* 3 columns with thin circle outline icons */}
        <div className="grid gap-10 sm:grid-cols-3">
          <BenefitCard
            icon={<StarIcon />}
            title={t("exclusiveAccess")}
            desc={t("exclusiveAccessDesc")}
          />
          <BenefitCard
            icon={<ChipIcon />}
            title={t("innovativeTech")}
            desc={t("innovativeTechDesc")}
          />
          <BenefitCard
            icon={<TrendIcon />}
            title={t("maxSuccess")}
            desc={t("maxSuccessDesc")}
          />
        </div>
      </div>
    </section>
  );
}

function BenefitCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#d8d8d8] bg-white">
        {icon}
      </div>
      <h3 className="text-[13px] font-semibold text-[#1a1a2e] sm:text-[14px]">
        {title}
      </h3>
      <p className="mt-1 text-[11px] text-[#9a9a9a] sm:text-[12px]">{desc}</p>
    </div>
  );
}

const iconStroke = "#7a9e9e";

function StarIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={iconStroke}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.2 1 5.9L12 17l-5.2 2.8 1-5.9L3.5 9.7l5.9-.9L12 3.5z" />
    </svg>
  );
}

function ChipIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={iconStroke}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
      {/* pins */}
      <path d="M10 6.5V4M12 6.5V4M14 6.5V4" />
      <path d="M10 20V17.5M12 20V17.5M14 20V17.5" />
      <path d="M6.5 10H4M6.5 12H4M6.5 14H4" />
      <path d="M20 10H17.5M20 12H17.5M20 14H17.5" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={iconStroke}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 17l5-5 3.5 3.5L20 8" />
      <path d="M15 8h5v5" />
    </svg>
  );
}
