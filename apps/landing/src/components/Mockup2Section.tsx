"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function Mockup2Section() {
  return (
    <section className="relative overflow-hidden bg-white pb-20 pt-10">
      <WavyBackground />
      <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
        <JoinFormCard />
        <AboutBlock />
        <FeaturesRow />
        <ServicesGrid />
      </div>
    </section>
  );
}

function WavyBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1440 1800"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <path
        d="M-100 220 C200 80, 520 320, 840 200 S1200 60, 1600 260"
        stroke="#b0d0d0"
        strokeWidth="1"
        opacity="0.35"
      />
      <path
        d="M-100 320 C220 180, 540 420, 860 280 S1220 140, 1600 360"
        stroke="#9cc1c1"
        strokeWidth="1"
        opacity="0.3"
      />
      <path
        d="M-100 440 C260 280, 580 540, 900 400 S1260 260, 1600 520"
        stroke="#c8dede"
        strokeWidth="1"
        opacity="0.25"
      />
      <path
        d="M-100 1200 C260 1040, 580 1300, 900 1160 S1260 1020, 1600 1280"
        stroke="#b0d0d0"
        strokeWidth="1"
        opacity="0.25"
      />
    </svg>
  );
}

function JoinFormCard() {
  const t = useTranslations("join");
  const [role, setRole] = useState<"member" | "partner">("member");

  // Sync role + smooth-scroll from URL hash (supports #join, #join-member, #join-partner)
  useEffect(() => {
    const apply = () => {
      const hash = window.location.hash;
      if (hash !== "#join" && hash !== "#join-member" && hash !== "#join-partner") {
        return;
      }
      if (hash === "#join-partner") setRole("partner");
      else if (hash === "#join-member") setRole("member");
      const el = document.getElementById("join");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  return (
    <div id="join" className="mx-auto max-w-[500px] scroll-mt-24">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="rounded-2xl border border-[#ececec] bg-white px-7 py-8 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.08)]"
      >
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <img
            src="/images/app-icon.jpeg"
            alt="TheONE Super App"
            className="h-28 w-28 rounded-[20px] shadow-md sm:h-32 sm:w-32"
          />
        </div>

        <h2 className="text-center font-display text-[22px] font-semibold text-[#1a1a2e]">
          {t("title")}
        </h2>
        <p className="mt-1 text-center text-[12px] italic text-[#8a8a8a]">
          {t("tagline")}
        </p>
        <p className="mt-4 text-center font-display text-[14px] font-medium uppercase tracking-[0.12em] text-[#5e8787]">
          {role === "partner" ? t("partnerHeading") : t("memberHeading")}
        </p>

        <div className="mt-6 pt-1">
          <p className="mb-2 text-[12px] text-[#888]">{t("role")}:</p>
          <div className="flex gap-2">
            <RoleToggle
              label={t("member")}
              active={role === "member"}
              onClick={() => setRole("member")}
            />
            <RoleToggle
              label={t("partner")}
              active={role === "partner"}
              onClick={() => setRole("partner")}
            />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {role === "member" ? (
            <>
              <FormInput type="text" placeholder={t("name")} required />
              <FormInput type="email" placeholder={t("email")} required />
              <FormInput type="tel" placeholder={t("phone")} />
              <FormInput type="text" placeholder={t("country")} />
              <FormTextarea placeholder={t("message")} rows={3} />
            </>
          ) : (
            <>
              <FormInput type="text" placeholder={t("companyBrand")} required />
              <FormInput type="text" placeholder={t("officeAddress")} />
              <FormInput type="text" placeholder={t("ownerName")} />
              <FormInput type="text" placeholder={t("contactPerson")} required />
              <FormInput type="email" placeholder={t("email")} required />
              <FormInput type="tel" placeholder={t("phone")} />
              <FormInput type="text" placeholder={t("partnerArea")} />
              <FormTextarea placeholder={t("shortDescription")} rows={3} />
              <FormTextarea placeholder={t("expectations")} rows={3} />
            </>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <button type="submit" className="hero-cta-btn inline-block">
            <span className="hero-cta-btn__ring inline-block rounded-full p-[1.5px]">
              <span className="hero-cta-btn__inner block min-w-[220px] rounded-full px-8 py-2 text-[14px] font-medium tracking-normal text-white transition-colors">
                {t("submit")}
              </span>
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

function FormTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className="w-full resize-none rounded-2xl border border-[#e6e6e6] bg-[#fafafa] px-5 py-2.5 text-[14px] text-[#333] placeholder-[#6a6a6a] outline-none transition-colors focus:border-[#7a9e9e]"
    />
  );
}

function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-full border border-[#e6e6e6] bg-[#fafafa] px-5 py-2.5 text-[14px] text-[#333] placeholder-[#6a6a6a] outline-none transition-colors focus:border-[#7a9e9e]"
    />
  );
}

function RoleToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "flex-1 rounded-full border border-[#6d9d9d] bg-white py-2 text-[13px] font-medium text-[#254f4f] shadow-[inset_0_0_0_1px_#6d9d9d] transition-colors"
          : "flex-1 rounded-full border border-[#dcdcdc] bg-white py-2 text-[13px] font-medium text-[#8a8a8a] transition-colors hover:border-[#b5b5b5] hover:text-[#555]"
      }
    >
      {label}
    </button>
  );
}

function AboutBlock() {
  const t = useTranslations("about");

  return (
    <div id="about" className="mx-auto mt-20 max-w-2xl text-center">
      <h2 className="font-display text-[24px] font-semibold text-[#1a1a2e] sm:text-[28px]">
        {t("title")}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-[13px] leading-[1.7] text-[#8a8a8a] sm:text-[14px]">
        {t.rich("description", {
          strong: (chunks) => (
            <span className="font-semibold text-[#5e8787]">{chunks}</span>
          ),
        })}
      </p>
    </div>
  );
}

function FeaturesRow() {
  const t = useTranslations("features");

  const items = [
    { key: "decision", descKey: "decisionDesc", icon: <DecisionIcon /> },
    { key: "connection", descKey: "connectionDesc", icon: <ConnectionIcon /> },
    { key: "transaction", descKey: "transactionDesc", icon: <TransactionIcon /> },
  ] as const;

  return (
    <div className="mx-auto mt-10 max-w-3xl">
      <div className="grid grid-cols-3 divide-x divide-[#e5e5e5]">
        {items.map(({ key, descKey, icon }) => (
          <div key={key} className="flex flex-col items-center px-4 text-center sm:px-6">
            <h3 className="text-[14px] font-semibold text-[#1a1a2e] sm:text-[15px]">
              {t(key)}
            </h3>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[#7a9e9e]">{icon}</span>
              <span className="text-[11px] text-[#9a9a9a]">{t(descKey)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServicesGrid() {
  const t = useTranslations("services");

  return (
    <div className="mt-14">
      {/* Top section: featured Health & Longevity + 2 stacked right cards + more */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {/* Health & Longevity — spans 2 cols × 2 rows */}
        <ServiceCard
          className="sm:col-span-2 sm:row-span-2"
          label={t("healthLongevity")}
          image="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&h=900&fit=crop"
          tint="#3f6d6d"
          featured
        />
        {/* Top-right two */}
        <ServiceCard
          label={t("beautySkincare")}
          image="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&h=400&fit=crop"
          tint="#6a4a5a"
        />
        <ServiceCard
          label={t("wellnessResorts")}
          image="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&h=400&fit=crop"
          tint="#4a6a5a"
        />
        {/* Middle-right two (continues the 2-row right column) */}
        <ServiceCard
          label={t("luxuryHotels")}
          image="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=400&fit=crop"
          tint="#4a3a2a"
        />
        <ServiceCard
          label={t("lifestyle")}
          image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=400&fit=crop"
          tint="#3a5567"
        />
        {/* Bottom row — 4 equal cards */}
        <ServiceCard
          className="sm:col-span-2"
          label={t("realEstate")}
          image="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=400&fit=crop"
          tint="#3a3a4a"
        />
        <ServiceCard
          className="sm:col-span-2"
          label={t("insurance")}
          image="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop"
          tint="#3a4a5a"
        />
      </div>
    </div>
  );
}

function ServiceCard({
  label,
  image,
  tint,
  className,
  featured,
}: {
  label: string;
  image: string;
  tint: string;
  className?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[14px] ${className ?? ""}`}
      style={{ aspectRatio: className?.includes("row-span-2") ? undefined : "4/3" }}
    >
      <img
        src={image}
        alt={label}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(160deg, ${tint}cc 0%, ${tint}44 55%, transparent 90%)`,
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
        <p
          className={
            featured
              ? "font-display text-[17px] font-semibold tracking-wide text-white drop-shadow-sm sm:text-[19px]"
              : "text-[12px] font-semibold tracking-wide text-white drop-shadow-sm sm:text-[13px]"
          }
        >
          {label}
        </p>
      </div>
    </div>
  );
}

/* --- Icons --- */
function DecisionIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9h6M9 13h6M9 17h4" />
    </svg>
  );
}

function ConnectionIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.5 11l7-4M8.5 13l7 4" />
    </svg>
  );
}

function TransactionIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h3" />
    </svg>
  );
}
