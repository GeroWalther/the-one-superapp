import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Locale routing only.
 *
 * The marketing site, the enrolment flow, and the pricing information are all
 * public — access control lives on the account area and the mobile API, both of
 * which check the session at the point of data access rather than here. Gating
 * in the proxy would only duplicate that check while running on every asset
 * request and prefetch.
 */
export function proxy(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // Everything except API routes, Next internals, and files with an extension.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
