import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";

export function CtaSection() {
  const t = useTranslations("cta");

  return (
    <section id="join" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
        <h2 className="text-[24px] font-bold text-[#1a1a2e] sm:text-[30px]">
          {t("discover")}
        </h2>
        <p className="mt-2 text-[15px] text-[#999]">{t("discoverSub")}</p>

        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button className="w-full rounded-full bg-[#7a9e9e] px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.15em] text-white shadow-lg shadow-[#7a9e9e]/20 transition-all duration-300 hover:bg-[#6a8e8e] hover:shadow-xl sm:w-auto">
            {t("partner")}
          </button>
          <button className="w-full rounded-full border-2 border-[#7a9e9e] bg-white px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.15em] text-[#7a9e9e] transition-all duration-300 hover:bg-[#7a9e9e] hover:text-white sm:w-auto">
            {t("member")}
          </button>
        </div>

        <div className="mt-7 flex items-center justify-center gap-2 text-[12px] text-[#bbb]">
          <Shield className="h-4 w-4 text-[#7a9e9e]" strokeWidth={1.5} />
          <span>{t("secure")} &middot; {t("privacy")}</span>
        </div>
      </div>
    </section>
  );
}
