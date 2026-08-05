import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Building2, ChevronRight, Gift, UserRound } from "lucide-react";
import { countByStatus, listApplications } from "@/lib/admin/queue";
import type { ApplicantType, ApplicationStatus } from "@/lib/domain";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  pending: "border-gold-300/40 bg-gold-300/10 text-gold-200",
  approved: "border-teal-400/40 bg-teal-400/10 text-teal-300",
  declined: "border-white/12 bg-white/5 text-mist-faint",
};

function isStatus(value: string | undefined): value is ApplicationStatus {
  return value === "pending" || value === "approved" || value === "declined";
}

function isType(value: string | undefined): value is ApplicantType {
  return value === "member" || value === "partner";
}

export default async function AdminQueuePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; type?: string; q?: string }>;
}) {
  const { locale } = await params;
  const { status, type, q } = await searchParams;
  const t = await getTranslations({ locale, namespace: "admin" });

  const [rows, counts] = await Promise.all([
    listApplications({
      status: isStatus(status) ? status : undefined,
      type: isType(type) ? type : undefined,
      search: q,
    }),
    countByStatus(),
  ]);

  const filters: { key: string; label: string; count?: number; href: string }[] = [
    {
      key: "all",
      label: t("queue.filterAll"),
      href: `/${locale}/admin`,
    },
    {
      key: "pending",
      label: t("queue.filterPending"),
      count: counts.pending,
      href: `/${locale}/admin?status=pending`,
    },
    {
      key: "approved",
      label: t("queue.filterApproved"),
      count: counts.approved,
      href: `/${locale}/admin?status=approved`,
    },
    {
      key: "declined",
      label: t("queue.filterDeclined"),
      count: counts.declined,
      href: `/${locale}/admin?status=declined`,
    },
  ];

  const active = isStatus(status) ? status : "all";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] font-light text-mist">
            {t("queue.title")}
          </h1>
          <p className="mt-1.5 text-[13.5px] text-mist-dim">
            {counts.pending > 0
              ? t("queue.pendingCount", { count: counts.pending })
              : t("queue.allClear")}
          </p>
        </div>

        <form action={`/${locale}/admin`} className="flex items-center gap-2">
          {isStatus(status) && (
            <input type="hidden" name="status" value={status} />
          )}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder={t("queue.searchPlaceholder")}
            className="field w-56 py-2 text-[13px]"
          />
          <button type="submit" className="btn btn-ghost px-4 py-2 text-[13px]">
            {t("queue.search")}
          </button>
        </form>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.key}
            href={filter.href}
            data-selected={active === filter.key}
            className="chip"
          >
            {filter.label}
            {filter.count !== undefined && (
              <span className="text-mist-faint">{filter.count}</span>
            )}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="glass-soft mt-8 rounded-2xl px-6 py-12 text-center text-[14px] text-mist-dim">
          {t("queue.empty")}
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/${locale}/admin/applications/${row.id}`}
                className="glass-soft group flex items-center gap-4 rounded-2xl px-5 py-4 transition-colors hover:border-white/20"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5">
                  {row.type === "partner" ? (
                    <Building2
                      className="h-[17px] w-[17px] text-mist-dim"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <UserRound
                      className="h-[17px] w-[17px] text-mist-dim"
                      strokeWidth={1.5}
                    />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[14.5px] font-medium text-mist">
                      {row.displayName}
                    </span>
                    {row.viaInvitation && (
                      <Gift
                        className="h-3.5 w-3.5 shrink-0 text-gold-300"
                        strokeWidth={1.6}
                      />
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-mist-faint">
                    {row.email} · {row.phone}
                  </span>
                </span>

                <span className="hidden text-[12px] text-mist-faint sm:block">
                  {new Date(row.createdAt).toLocaleDateString(locale)}
                </span>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] ${STATUS_STYLES[row.status]}`}
                >
                  {t(`status.${row.status}`)}
                </span>

                <ChevronRight
                  className="h-4 w-4 shrink-0 text-mist-faint transition-transform group-hover:translate-x-0.5"
                  strokeWidth={1.6}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
