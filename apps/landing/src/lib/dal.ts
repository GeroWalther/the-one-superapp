import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession } from "./session-cookie";
import { findMemberById, type PublicMember } from "./users";

/**
 * The single place any page or layout should ask "who is signed in?".
 *
 * `cache` memoises this for the duration of one render pass, so a layout and
 * the page it wraps share a single database round-trip.
 *
 * Failures resolve to `null` (fail closed): a database outage shows the public
 * teaser to visitors and bounces members to the login page rather than
 * returning a 500 for the whole site.
 */
export const getCurrentMember = cache(
  async (): Promise<PublicMember | null> => {
    try {
      const session = await readSession();
      if (!session) return null;
      return await findMemberById(session.userId);
    } catch (error) {
      console.error("[dal] failed to resolve current member:", error);
      return null;
    }
  },
);

/** Use in gated pages — redirects to the localised login when signed out. */
export async function requireMember(locale: string): Promise<PublicMember> {
  const member = await getCurrentMember();

  if (!member) {
    redirect(`/${locale}/login`);
  }

  return member;
}
