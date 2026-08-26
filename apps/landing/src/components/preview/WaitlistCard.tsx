"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * The "Join TheONE" card from the mockup.
 *
 * The Member/Partner segmented control is real state — a toggle that does not
 * move is the first thing anyone reviewing a design will click. Submission is
 * deliberately inert: this section is a design comparison, and a form that
 * quietly discarded a real address would be worse than one that says so.
 */
export function WaitlistCard() {
  const t = useTranslations("preview");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "partner">("member");

  return (
    <div className="mx-auto w-full max-w-lg rounded-[22px] border border-white/70 bg-white/80 p-7 shadow-[0_24px_60px_-30px_rgba(43,52,64,0.35)] backdrop-blur-sm sm:p-9">
      {/* Title with a rule running out to each side. */}
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-line" />
        <h3 className="font-display text-[20px] font-light text-ink">
          {t("joinTitle")}
        </h3>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-line" />
      </div>

      <div className="mt-7 space-y-3">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("name")}
          aria-label={t("name")}
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[14px] text-ink shadow-[inset_0_1px_2px_rgba(43,52,64,0.05)] outline-none transition-colors placeholder:text-ink-faint focus:border-aqua-400"
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("email")}
          aria-label={t("email")}
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[14px] text-ink shadow-[inset_0_1px_2px_rgba(43,52,64,0.05)] outline-none transition-colors placeholder:text-ink-faint focus:border-aqua-400"
        />
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <span className="text-[13.5px] text-ink-soft">{t("iAm")}</span>

        <div
          role="radiogroup"
          aria-label={t("iAm")}
          className="flex overflow-hidden rounded-lg border border-line bg-paper-soft"
        >
          {(["member", "partner"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={role === value}
              onClick={() => setRole(value)}
              className={`px-6 py-2 text-[13.5px] transition-colors ${
                role === value
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {t(value)}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="mt-7 w-full rounded-xl border border-line bg-white py-3.5 text-[15px] text-ink shadow-[0_10px_24px_-14px_rgba(43,52,64,0.5)] transition-transform duration-300 hover:-translate-y-0.5"
      >
        {t("submit")}
      </button>
    </div>
  );
}
