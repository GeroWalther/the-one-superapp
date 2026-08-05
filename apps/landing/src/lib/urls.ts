/**
 * Absolute URLs for links that travel outside the app (emails, Stripe returns).
 *
 * Falls back to the Vercel-provided host so preview deployments produce working
 * links without extra configuration, then to localhost for development.
 */
export function siteUrl(path = "/"): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:5656");

  const base = configured.replace(/\/$/, "");
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
