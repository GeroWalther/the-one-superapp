import "server-only";
import type { Document } from "mongodb";
import { applications, pageViews } from "../db/collections";
import { dayOf } from "./track";

export type Row = { key: string; count: number };

export type AnalyticsReport = {
  days: number;
  since: string;
  totals: { visitors: number; visits: number; pageViews: number; applications: number };
  daily: { day: string; visitors: number; visits: number }[];
  channels: Row[];
  sources: Row[];
  campaigns: Row[];
  countries: Row[];
  cities: Row[];
  landingPages: Row[];
  pages: Row[];
  devices: Row[];
  languages: Row[];
  applicationsBySource: Row[];
  applicationsByCountry: Row[];
  firstRecordedAt: string | null;
};

const TOP = 10;

async function topBy(match: Document, field: string, limit = TOP): Promise<Row[]> {
  const rows = await (await pageViews())
    .aggregate<{ _id: string | null; count: number }>([
      { $match: match },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: limit },
    ])
    .toArray();
  return rows.map((row) => ({ key: row._id ?? "", count: row.count }));
}

export async function analyticsReport(days: number): Promise<AnalyticsReport> {
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const all = { at: { $gte: since } };
  const visits = { ...all, entry: true };
  const views = await pageViews();

  const [
    pageViewCount,
    visitCount,
    visitorDays,
    dailyRows,
    channels,
    sources,
    campaignRows,
    countries,
    cities,
    landingPages,
    pages,
    devices,
    languages,
    applicationRows,
    first,
  ] = await Promise.all([
    views.countDocuments(all),
    views.countDocuments(visits),
    // Visitor ids rotate daily, so "visitors" is the sum of each day's uniques.
    views
      .aggregate<{ n: number }>([
        { $match: all },
        { $group: { _id: { day: "$day", v: "$visitorId" } } },
        { $count: "n" },
      ])
      .toArray(),
    views
      .aggregate<{ _id: string; visitors: number; visits: number }>([
        { $match: all },
        {
          $group: {
            _id: "$day",
            visitorIds: { $addToSet: "$visitorId" },
            visits: { $sum: { $cond: ["$entry", 1, 0] } },
          },
        },
        { $project: { visitors: { $size: "$visitorIds" }, visits: 1 } },
      ])
      .toArray(),
    topBy(visits, "channel"),
    topBy(visits, "source"),
    (await pageViews())
      .aggregate<{ _id: { c: string; s: string | null; m: string | null }; count: number }>([
        { $match: { ...visits, utmCampaign: { $ne: null } } },
        { $group: { _id: { c: "$utmCampaign", s: "$utmSource", m: "$utmMedium" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: TOP },
      ])
      .toArray(),
    topBy(visits, "country"),
    topBy({ ...visits, city: { $ne: null } }, "city"),
    topBy(visits, "path"),
    topBy(all, "path"),
    topBy(visits, "device"),
    topBy(visits, "locale"),
    (await applications())
      .find({ createdAt: { $gte: since } })
      .project<{ attribution?: { source?: string; country?: string | null } | null }>({ attribution: 1 })
      .toArray(),
    views.find({}).sort({ at: 1 }).limit(1).project<{ at: Date }>({ at: 1 }).toArray(),
  ]);

  // Every day in the range, including the empty ones, so the chart has no gaps.
  const byDay = new Map(dailyRows.map((row) => [row._id, row]));
  const daily: AnalyticsReport["daily"] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = dayOf(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
    const row = byDay.get(day);
    daily.push({ day, visitors: row?.visitors ?? 0, visits: row?.visits ?? 0 });
  }

  const count = (values: string[]): Row[] => {
    const tally = new Map<string, number>();
    for (const value of values) tally.set(value, (tally.get(value) ?? 0) + 1);
    return [...tally].map(([key, n]) => ({ key, count: n })).sort((a, b) => b.count - a.count).slice(0, TOP);
  };

  return {
    days,
    since: since.toISOString(),
    totals: {
      visitors: visitorDays[0]?.n ?? 0,
      visits: visitCount,
      pageViews: pageViewCount,
      applications: applicationRows.length,
    },
    daily,
    channels,
    sources,
    campaigns: campaignRows.map((row) => ({
      key: [row._id.c, [row._id.s, row._id.m].filter(Boolean).join(" / ")].filter(Boolean).join(" · "),
      count: row.count,
    })),
    countries,
    cities,
    landingPages,
    pages,
    devices,
    languages,
    // Applications from before tracking existed carry no attribution.
    applicationsBySource: count(applicationRows.map((row) => row.attribution?.source ?? "unknown")),
    applicationsByCountry: count(applicationRows.map((row) => row.attribution?.country ?? "")),
    firstRecordedAt: first[0]?.at.toISOString() ?? null,
  };
}
