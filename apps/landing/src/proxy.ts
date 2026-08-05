import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE, decrypt } from "./lib/session";

const intlMiddleware = createMiddleware(routing);

/* Routes that require a session. */
const GATED_ROUTES = ["/members", "/about"];

/* Routes a signed-in member has no reason to see. */
const SIGNED_OUT_ROUTES = ["/", "/enroll", "/login"];

function matches(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) =>
      pathname === route || (route !== "/" && pathname.startsWith(`${route}/`)),
  );
}

export async function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/");
  const locale = segments[1];

  // Paths without a locale prefix fall through to next-intl, which redirects
  // them to the localised equivalent; auth is then checked on that request.
  if (routing.locales.includes(locale as (typeof routing.locales)[number])) {
    const path = `/${segments.slice(2).join("/")}`.replace(/\/$/, "") || "/";

    // Optimistic check only — the cookie signature is verified but the database
    // is not touched. Gated pages re-check through the DAL before rendering.
    const session = await decrypt(request.cookies.get(SESSION_COOKIE)?.value);

    if (!session && matches(path, GATED_ROUTES)) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session && matches(path, SIGNED_OUT_ROUTES)) {
      return NextResponse.redirect(new URL(`/${locale}/members`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Everything except API routes, Next internals, and files with an extension.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
