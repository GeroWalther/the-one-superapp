import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Download } from "lucide-react";

/**
 * The step after paying: get the app and sign in. Shown at the top of the
 * account page, because it is the one thing a live member came here to do.
 * The password is never shown — the member chose it — so the panel names the
 * username and points to the reset page instead.
 */
export async function AppAccessPanel({
  locale,
  status,
  username,
  email,
}: {
  locale: string;
  status: string;
  username: string;
  email: string;
}) {
  const t = await getTranslations({ locale, namespace: "account.app" });
  const appUrl = process.env.NEXT_PUBLIC_IOS_APP_URL || null;
  const live = status === "active";

  return (
    <section className="glass-soft mt-8 flex flex-col gap-5 rounded-2xl px-6 py-5 sm:flex-row sm:items-start">
      <Image
        src="/images/theone-icon-v2.png"
        alt=""
        width={64}
        height={64}
        unoptimized
        className="h-16 w-16 shrink-0"
      />

      <div className="min-w-0 flex-1">
        <h2 className="text-[17px] font-semibold text-ink">{t("title")}</h2>

        {live ? (
          <>
            <p className="mt-1.5 text-[15px] leading-[1.6] text-ink-soft">{t("liveBody")}</p>

            <dl className="mt-4 grid gap-2 text-[15px] sm:grid-cols-[auto_1fr] sm:gap-x-6">
              <dt className="text-ink-faint">{t("username")}</dt>
              <dd className="font-medium text-ink">{username}</dd>
              <dt className="text-ink-faint">{t("orEmail")}</dt>
              <dd className="break-all text-ink">{email}</dd>
              <dt className="text-ink-faint">{t("password")}</dt>
              <dd className="text-ink">
                {t("passwordHint")}{" "}
                <Link href={`/${locale}/forgot-password`} className="text-aqua-700 underline-offset-2 hover:underline">
                  {t("forgot")}
                </Link>
              </dd>
            </dl>

            {appUrl ? (
              <a href={appUrl} className="btn btn-primary mt-5 inline-flex px-6 py-2.5 text-[15px]">
                <Download className="h-4 w-4" strokeWidth={1.8} />
                {t("download")}
              </a>
            ) : (
              <p className="mt-4 text-[14px] text-ink-faint">{t("linkSoon")}</p>
            )}
          </>
        ) : (
          <p className="mt-1.5 text-[15px] leading-[1.6] text-ink-soft">{t("pendingBody")}</p>
        )}
      </div>
    </section>
  );
}
