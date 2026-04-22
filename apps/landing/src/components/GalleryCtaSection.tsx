import { useTranslations } from "next-intl";

const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=700&h=480&fit=crop",
    alt: "Consultation",
  },
  {
    src: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=700&h=480&fit=crop",
    alt: "Luxury suite",
  },
  {
    src: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=700&h=480&fit=crop",
    alt: "Wellness retreat",
  },
];

export function GalleryCtaSection() {
  const t = useTranslations("cta");

  return (
    <section
      id="gallery"
      className="bg-gradient-to-b from-white to-[#f5f8f8] pb-16 pt-6 sm:pb-20"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* 3 photos */}
        <div className="grid gap-3 sm:grid-cols-3">
          {galleryImages.map((img) => (
            <div key={img.src} className="overflow-hidden rounded-2xl">
              <img
                src={img.src}
                alt={img.alt}
                className="h-full w-full object-cover"
                style={{ aspectRatio: "7/5" }}
              />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div id="cta" className="mt-12 text-center sm:mt-14">
          <h2 className="font-display text-[24px] font-semibold leading-tight text-[#1a1a2e] sm:text-[28px]">
            {t.rich("discover", {
              em: (chunks) => (
                <em className="italic font-normal">{chunks}</em>
              ),
            })}
          </h2>
          <p className="mt-2 text-[13px] text-[#9a9a9a]">{t("discoverSub")}</p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#join-partner" className="hero-cta-btn inline-block">
              <span className="hero-cta-btn__ring inline-block rounded-full p-[1.5px]">
                <span className="hero-cta-btn__inner block min-w-[200px] rounded-full px-8 py-2 text-[15px] font-medium tracking-normal text-white transition-colors">
                  {t("partner")}
                </span>
              </span>
            </a>
            <a href="#join-member" className="hero-cta-btn--light inline-block">
              <span className="hero-cta-btn__ring inline-block rounded-full p-[1.5px]">
                <span className="hero-cta-btn--light__inner block min-w-[200px] rounded-full px-8 py-2 text-[15px] font-medium tracking-normal transition-colors">
                  {t("member")}
                </span>
              </span>
            </a>
          </div>

          {/* Trust indicators — 3 icons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-[#8a8a8a]">
            <TrustItem icon={<LockIcon />} label={t("secure")} />
            <TrustItem icon={<EyeOffIcon />} label={t("discreet")} />
            <TrustItem icon={<BadgeCheckIcon />} label={t("trustworthy")} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      <span>{label}</span>
    </span>
  );
}

const strokeColor = "#6d9d9d";

function LockIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.6 19.6 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a19.52 19.52 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

function BadgeCheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2l2.39 2.09L17.5 3.5l.91 3.09L21.5 7.5l-1.59 2.91L21.5 12l-2.09 2.39.59 3.11-3.09.91L15.5 21.5l-2.91-1.59L10.5 21.5l-1.5-2.59-3.11.59-.91-3.09L1.5 14.5l1.59-2.91L1.5 9.5l2.09-2.39-.59-3.11L6.09 3.09 7.5 1.5l2.91 1.59L12 2z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
