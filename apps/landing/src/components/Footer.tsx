import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-white pb-6 pt-4">
      <div className="mx-auto max-w-5xl px-6">
        <p className="mb-4 text-center text-[11px] text-[#bbb]">
          {t("waitlistNote")}
        </p>

        <div className="mb-4 flex items-center justify-center gap-1.5 text-[11px] text-[#bbb]">
          <Shield className="h-3 w-3 text-[#7a9e9e]" strokeWidth={1.5} />
          <span>100% Sicher</span>
          <span>&middot;</span>
          <span>{t("privacy")}</span>
          <span>&middot;</span>
          <span>{t("imprint")}</span>
        </div>

        <p className="text-center text-[10px] text-[#ccc]">
          {t("copyright")}
        </p>
      </div>
    </footer>
  );
}
