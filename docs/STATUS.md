# TheONE — Status

Where the project stands and what is still open. Update this whenever something
ships or a decision is made. How things are built lives in
[ARCHITECTURE.md](ARCHITECTURE.md); this file is about state.

_Last updated: 2026-10-05_

---

## Live now

**Website:** https://www.theone-superapp.com (the bare domain and
theone-superapp.vercel.app forward there). German and English.

| Area | State | Last verified |
|---|---|---|
| Domain + SSL | ✅ Live on www; DNS at easyname (`A 216.198.79.1`, `www` CNAME to Vercel) | 2026-09-30 |
| Database (MongoDB Atlas, cluster0) | ✅ Connected, production and local share it | 2026-10-05 |
| Application forms (member + business partner) | ✅ Saved to the database as pending | 2026-10-05, live |
| Confirmation email ("application received") | ✅ Sent through Resend from `noreply@theone-superapp.com` | 2026-10-05, live |
| Admin dashboard: review queue, full applicant details | ✅ | 2026-10-05, live |
| Approve, with approval email + activation link | ✅ | 2026-10-05, live |
| Reject, with rejection email; email + phone blocklisted | ✅ Re-applying with the same email is refused | 2026-10-05, live |
| Reopen a rejection (back to pending, block lifted) | ✅ | 2026-10-05, live |
| Resend approval email | ✅ | 2026-10-05, live |
| Activation: applicant chooses username + password | ✅ | 2026-09-30, local |
| "You're live" email with the app login (username, never the password) | ✅ in test mode; real trigger needs Stripe | 2026-09-30, local |
| Payment (Stripe checkout, webhook) | ⏳ Built, **waiting for Stripe keys**. Until then approved accounts can go live free ("test mode"), which switches itself off once `STRIPE_SECRET_KEY` is set | — |
| Analytics in the admin dashboard | ✅ Visitors, channels, sources, campaigns, countries, cities, pages, devices, applications by source/country, tracking-link builder | 2026-10-05, local |
| Branding: teal logo on site, favicon, emails, app | ✅ | 2026-10-01 |
| "Business partner" wording everywhere | ✅ Site, emails, Stripe plan names, app, assistant | 2026-10-01 |

**iOS app:** on TestFlight as "TheONE SUPER APP" (`com.theone.superapp`),
iPhone only, iOS 17+. Sign-in, AI assistant, Discover, Messages, Profile all
work against production. Logo on launch screen, sign-in and every tab.

---

## Open

### Needs something from the client
- [ ] **Stripe:** send the secret key; create a webhook to
      `https://www.theone-superapp.com/api/stripe/webhook` (must be **www**: Stripe
      does not follow redirects) with events `checkout.session.completed`,
      `customer.subscription.updated`, `customer.subscription.deleted`,
      `invoice.payment_failed`, and send its signing secret. Then: test a real
      payment and the "you're live" email end to end.
- [ ] **Delete test data?** All 20 pending applications in the queue are fake
      (`@example.com`, `bergklinik-davos.example`), plus 5 "Zurich Dental 17…"
      business partner listings and 10 `tester…` accounts that members see in
      the app. Needs an explicit yes; deletion is permanent.
- [ ] **Admin password:** confirm the `gero` admin can still sign in at
      `/en/login` (last sign-in 2026-08-09). Can be reset on request.

### Before launch
- [ ] **Imprint (Impressum) and privacy policy (Datenschutzerklärung) pages.**
      Legally required in AT/DE; the footer links exist but no pages behind
      them. The privacy policy must cover the applications, emails (Resend),
      payments (Stripe), the AI assistant (Anthropic), hosting (Vercel), the
      database (MongoDB Atlas) and the cookieless analytics.
- [ ] **Database plan:** Atlas is on the free tier, which pauses when idle and
      takes the whole site down (happened 2026-09-30). Move to Flex or M10.
- [ ] **Vercel auto-deploy:** pushes to GitHub stopped triggering deploys;
      deploying by hand meanwhile. Check Vercel → Project → Settings → Git.
- [ ] **Original logo files** in high resolution: the hero artwork is 585 px
      wide and the app icon came from a 1170 px image.

### App Store
- [ ] Add TestFlight testers (App Store Connect → TestFlight → Internal Testing).
- [ ] For the public launch: screenshots, description, privacy policy URL, App
      Privacy answers, then submit for review.
- [ ] Once there is an App Store link, set `NEXT_PUBLIC_IOS_APP_URL` so the
      "you're live" email gets a "Download the app" button.

### Optional
- [ ] Rotate the Resend API key (it was pasted into a chat).
- [ ] Logo on detail screens in the app (partner page, single chat), which
      currently show the name in the middle.

---

## Decisions made

- **Applicants choose their own password** at activation, before paying. The
  "you're live" email sends the username and a reset link, never a password.
- **A rejection blocks the email and the phone number**, both stored only as
  keyed hashes. Reopening lifts only the blocks that rejection created.
- **Analytics are cookieless and first-party**: no Google Analytics, no cookie
  banner needed for them; no IP addresses stored; signed-in admins and bots
  excluded. Data is kept 13 months.
- **iOS 17 minimum**: the same iPhones as iOS 18 (XS/XR and newer). iOS 16 would
  add only iPhone 8/X and would need the data layer rewritten.
- **iPhone only**: the app is portrait-only, which Apple refuses on iPad.
- **"Business partner" / "Geschäftspartner"** for the audience; "partnership",
  "Ansprechpartner" and "partner businesses" keep their words.

---

## How to

| Task | How |
|---|---|
| Deploy the website | Push to `main`. If no deploy appears within a few minutes, from the repo root: `VERCEL_ORG_ID=team_sjSRYBlwKA0hBcvyNRKc97Xs VERCEL_PROJECT_ID=prj_3NwQBjmyCndsGhJIcpG57T00vQfu npx vercel deploy --prod --yes` |
| Ship an iOS build to TestFlight | `xcodebuild … archive -allowProvisioningUpdates`, then `xcodebuild -exportArchive` with method `app-store-connect`, destination `upload`, team `W67AW8RFW4`. The build number bumps itself. |
| Run locally | `pnpm dev` in `apps/landing` (port 5656). ⚠ Local uses the **production database and real email**. |
| Create an admin | `pnpm admin:create <email> <username> <password>`; the email must be in `ADMIN_EMAILS`. |
| Make a tracking link | Admin → Analytics → Tracking link. |

## Services

| Service | Used for | Account |
|---|---|---|
| Vercel | Hosting, project `theone-superapp` | gerowalthers-projects |
| MongoDB Atlas | Database, project "theonesuperapp", `cluster0` | Rayquaza's Org |
| Resend | Email, domain `theone-superapp.com` (EU) | verified |
| Stripe | Payments | not connected yet |
| Anthropic | AI assistant | key set in production |
| easyname | Domain + DNS | — |
| App Store Connect | iOS app, team `W67AW8RFW4` | — |
