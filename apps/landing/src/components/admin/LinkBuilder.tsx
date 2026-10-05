"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Builds a tagged link for one post, ad or newsletter. Visits through it show
 * up by name under Campaigns, which is the only reliable way to tell two
 * Instagram posts apart: the referrer alone just says "Instagram".
 */
export function LinkBuilder({
  base,
  labels,
}: {
  base: string;
  labels: {
    title: string;
    note: string;
    page: string;
    source: string;
    medium: string;
    campaign: string;
    copy: string;
    copied: string;
  };
}) {
  const [page, setPage] = useState("/de");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [copied, setCopied] = useState(false);

  const slug = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9._-]/g, "");

  const url = new URL(page.startsWith("/") ? page : `/${page}`, base);
  if (slug(source)) url.searchParams.set("utm_source", slug(source));
  if (slug(medium)) url.searchParams.set("utm_medium", slug(medium));
  if (slug(campaign)) url.searchParams.set("utm_campaign", slug(campaign));
  const link = url.toString();

  const field = (label: string, value: string, set: (v: string) => void, placeholder: string) => (
    <label className="block">
      <span className="text-[13px] text-ink-soft">{label}</span>
      <input
        value={value}
        onChange={(event) => {
          set(event.target.value);
          setCopied(false);
        }}
        placeholder={placeholder}
        className="field mt-1 w-full py-2 text-[15px]"
      />
    </label>
  );

  return (
    <section className="glass-soft rounded-2xl px-5 py-4">
      <h2 className="text-[15px] font-semibold text-ink">{labels.title}</h2>
      <p className="mt-1 text-[15px] leading-[1.6] text-ink-soft">{labels.note}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {field(labels.page, page, setPage, "/de")}
        {field(labels.source, source, setSource, "instagram")}
        {field(labels.medium, medium, setMedium, "social")}
        {field(labels.campaign, campaign, setCampaign, "launch-oktober")}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="min-w-0 flex-1 break-all rounded-xl border border-line bg-paper px-3 py-2 text-[13px] text-aqua-700">
          {link}
        </code>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
          }}
          className="btn btn-ghost shrink-0 px-4 py-2 text-[14px]"
        >
          {copied ? <Check className="h-4 w-4" strokeWidth={1.8} /> : <Copy className="h-4 w-4" strokeWidth={1.8} />}
          {copied ? labels.copied : labels.copy}
        </button>
      </div>
    </section>
  );
}
