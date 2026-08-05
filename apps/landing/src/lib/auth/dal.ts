import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession } from "./session-cookie";
import { findAccountById, type PublicAccount } from "./accounts";

/**
 * The single place any page, action, or route handler asks "who is signed in?".
 *
 * `cache` memoises it for one render pass, so a layout and the page it wraps
 * share a database round-trip.
 *
 * Failures resolve to `null` — fail closed. A database outage should bounce
 * people to the login page, never hand them someone else's dashboard.
 */
export const getCurrentAccount = cache(
  async (): Promise<PublicAccount | null> => {
    try {
      const session = await readSession();
      if (!session) return null;

      const account = await findAccountById(session.accountId);
      if (!account) return null;

      // The cookie carries a role, but the database is the authority. A role
      // changed after the token was issued must take effect immediately.
      if (account.role !== session.role) return null;

      return account;
    } catch (error) {
      console.error("[dal] failed to resolve current account:", error);
      return null;
    }
  },
);

export async function requireAccount(locale: string): Promise<PublicAccount> {
  const account = await getCurrentAccount();
  if (!account) redirect(`/${locale}/login`);
  return account;
}

/**
 * Administrators only.
 *
 * A signed-in non-admin is sent to their own account area rather than the login
 * page — bouncing an authenticated person to a login form is a confusing way to
 * say "not for you", and the redirect target also avoids confirming that
 * /admin exists.
 */
export async function requireAdmin(locale: string): Promise<PublicAccount> {
  const account = await getCurrentAccount();
  if (!account) redirect(`/${locale}/login?next=/${locale}/admin`);
  if (account.role !== "admin") redirect(`/${locale}/account`);
  return account;
}
