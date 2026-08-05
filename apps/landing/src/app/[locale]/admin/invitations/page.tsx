import { getTranslations } from "next-intl/server";
import { Gift, Undo2 } from "lucide-react";
import { listInvitations } from "@/lib/admin/invitations";
import { revokeInvitationAction } from "@/app/actions/admin";
import { InviteForm } from "@/components/admin/InviteForm";
import type { InvitationStatus } from "@/lib/domain";

const STATUS_STYLES: Record<InvitationStatus, string> = {
  sent: "border-gold-300/40 bg-gold-300/10 text-gold-200",
  redeemed: "border-teal-400/40 bg-teal-400/10 text-teal-300",
  revoked: "border-white/12 bg-white/5 text-mist-faint",
  expired: "border-white/12 bg-white/5 text-mist-faint",
};

export default async function AdminInvitationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  const rows = await listInvitations();

  return (
    <div>
      <h1 className="font-display text-[30px] font-light text-mist">
        {t("invitations.title")}
      </h1>
      <p className="mt-1.5 text-[13.5px] text-mist-dim">
        {t("invitations.subtitle")}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <InviteForm />

        <div>
          {rows.length === 0 ? (
            <p className="glass-soft rounded-2xl px-6 py-12 text-center text-[14px] text-mist-dim">
              {t("invitations.empty")}
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="glass-soft flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5">
                    <Gift
                      className="h-4 w-4 text-mist-dim"
                      strokeWidth={1.5}
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] text-mist">
                      {row.invitedEmail}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-mist-faint">
                      {t(`type.${row.role}`)}
                      {" · "}
                      {row.kind === "admin"
                        ? t("invitations.byAdmin", {
                            months: row.grantsFreeMonths,
                          })
                        : t("invitations.byMember", {
                            name: row.inviterName ?? "—",
                          })}
                    </span>
                  </span>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] ${STATUS_STYLES[row.status]}`}
                  >
                    {t(`invitationStatus.${row.status}`)}
                  </span>

                  {row.status === "sent" && (
                    <form action={revokeInvitationAction}>
                      <input type="hidden" name="invitationId" value={row.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] text-mist-faint transition-colors hover:bg-white/5 hover:text-mist"
                      >
                        <Undo2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                        {t("invitations.revoke")}
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
