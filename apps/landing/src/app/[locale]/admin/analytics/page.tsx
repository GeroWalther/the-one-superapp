import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { analyticsReport, type Row } from "@/lib/analytics/report";
import { CHANNELS } from "@/lib/analytics/classify";
import { BarList } from "@/components/admin/BarList";
import { VisitorsChart } from "@/components/admin/VisitorsChart";
import { LinkBuilder } from "@/components/admin/LinkBuilder";
import { siteUrl } from "@/lib/urls";

const RANGES = [7, 30, 90] as const;

function flag(code: string): string {
  return /^[A-Z]{2}$/.test(code)
    ? String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
    : "";
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { locale } = await params;
  const { range } = await searchParams;
  const days = RANGES.find((r) => String(r) === range) ?? 30;
  const t = await getTranslations({ locale, namespace: "admin.analytics" });
  const report = await analyticsReport(days);

  const regionName = new Intl.DisplayNames([locale], { type: "region" });
  const country = (code: string) =>
    code ? `${flag(code)} ${regionName.of(code) ?? code}` : t("unknown");
  const channel = (key: string) =>
    (CHANNELS as readonly string[]).includes(key) ? t(`channel.${key}`) : key;

  const rows = (list: Row[], label: (key: string) => React.ReactNode = (k) => k || t("unknown")) =>
    list.map((row) => ({ key: row.key || "_", label: label(row.key), count: row.count }));

  const { totals } = report;
  const conversion = totals.visits ? (totals.applications / totals.visits) * 100 : 0;
  const tiles = [
    { label: t("visitors"), value: totals.visitors.toLocaleString(locale) },
    { label: t("visits"), value: totals.visits.toLocaleString(locale) },
    { label: t("pageViews"), value: totals.pageViews.toLocaleString(locale) },
    { label: t("applications"), value: totals.applications.toLocaleString(locale) },
    {
      label: t("conversion"),
      value: `${conversion.toLocaleString(locale, { maximumFractionDigits: 1 })}%`,
    },
  ];

  const visitsLabel = t("visitsCol");
  const empty = t("empty");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] font-light text-ink">{t("title")}</h1>
          <p className="mt-1.5 max-w-xl text-[15px] leading-[1.6] text-ink-soft">
            {t("subtitle")}{" "}
            {report.firstRecordedAt
              ? t("since", { date: new Date(report.firstRecordedAt).toLocaleDateString(locale) })
              : t("noData")}
          </p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/${locale}/admin/analytics?range=${r}`}
              data-selected={r === days}
              className="chip"
            >
              {t("range", { days: r })}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tiles.map((tile) => (
          <div key={tile.label} className="glass-soft rounded-2xl px-4 py-3.5">
            <p className="text-[14px] text-ink-soft">{tile.label}</p>
            <p className="mt-1 text-[26px] font-semibold leading-tight text-ink">{tile.value}</p>
          </div>
        ))}
      </div>

      <section className="glass-soft mt-4 rounded-2xl px-5 py-4">
        <h2 className="text-[15px] font-semibold text-ink">{t("dailyTitle")}</h2>
        <div className="mt-3">
          <VisitorsChart
            data={report.daily}
            locale={locale}
            labels={{
              visitors: t("visitorsLower"),
              visits: t("visitsLower"),
              table: t("dailyTable"),
              day: t("day"),
            }}
          />
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <BarList title={t("channels")} rows={rows(report.channels, channel)} locale={locale} empty={empty} valueLabel={visitsLabel} />
        <BarList title={t("sources")} rows={rows(report.sources)} locale={locale} empty={empty} valueLabel={visitsLabel} />
        <BarList title={t("countries")} rows={rows(report.countries, country)} locale={locale} empty={empty} valueLabel={visitsLabel} />
        <BarList title={t("cities")} rows={rows(report.cities)} locale={locale} empty={empty} valueLabel={visitsLabel} />
        <BarList title={t("campaigns")} rows={rows(report.campaigns)} locale={locale} empty={t("campaignsEmpty")} valueLabel={visitsLabel} />
        <BarList title={t("landingPages")} rows={rows(report.landingPages)} locale={locale} empty={empty} valueLabel={visitsLabel} />
        <BarList title={t("pages")} rows={rows(report.pages)} locale={locale} empty={empty} valueLabel={t("viewsCol")} />
        <BarList
          title={t("devices")}
          rows={rows(report.devices, (k) => t(`device.${k}`))}
          locale={locale}
          empty={empty}
          valueLabel={visitsLabel}
        />
        <BarList
          title={t("appsBySource")}
          rows={rows(report.applicationsBySource, (k) => (k === "unknown" ? t("beforeTracking") : k))}
          locale={locale}
          empty={empty}
          valueLabel={t("applicationsCol")}
        />
        <BarList
          title={t("appsByCountry")}
          rows={rows(report.applicationsByCountry, country)}
          locale={locale}
          empty={empty}
          valueLabel={t("applicationsCol")}
        />
        <BarList
          title={t("languages")}
          rows={rows(report.languages, (k) => (k === "de" ? "Deutsch" : k === "en" ? "English" : k))}
          locale={locale}
          empty={empty}
          valueLabel={visitsLabel}
        />
      </div>

      <div className="mt-4">
        <LinkBuilder
          base={siteUrl("/")}
          labels={{
            title: t("link.title"),
            note: t("link.note"),
            page: t("link.page"),
            source: t("link.source"),
            medium: t("link.medium"),
            campaign: t("link.campaign"),
            copy: t("link.copy"),
            copied: t("link.copied"),
          }}
        />
      </div>
    </div>
  );
}
