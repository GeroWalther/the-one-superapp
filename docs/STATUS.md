# TheONE — Status

Where the project stands and what is still open. Update this whenever something
ships or a decision is made. How things are built lives in
[ARCHITECTURE.md](ARCHITECTURE.md); this file is about state.

_Last updated: 2026-10-05 (Stripe live)_

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
| "You're live" email with the app login (username, never the password) | ✅ Sent automatically after payment | 2026-10-05, live |
| Payment (Stripe, **live**) | ✅ **First real sign-up done end to end**: applied → approved (Early Access) → activated → paid 1.00 € (0.17 € VAT) → webhook → account active → "you're live" email delivered 2 s later. | 2026-10-05, live |
| **Member price: €10 first month, then €49/month** | ✅ Automatic one-off €39 discount (coupon `theone_member_intro`) on new members' first invoice; not used when the member starts with free months. Promo-code field is not shown on those checkouts (Stripe allows one or the other). | 2026-10-06, live Stripe |
| **Early Access plan** (€1/month + VAT) | ✅ Its own Stripe product. Admin ticks "Early Access" when approving (members and business partners), or switches it on the application page until the person pays. Checkout then charges €1 (€1.21 with Spanish VAT). | 2026-10-05, local → live Stripe checkout |
| Discount code **TESTEARLYACCESS** | ✅ Member plan €1/month (€48 off, forever). Enter it on the Stripe checkout page. Switch off in Stripe → Product catalogue → Coupons. | 2026-10-05 |
| Analytics in the admin dashboard | ✅ Visitors, channels, sources, campaigns, countries, cities, pages, devices, applications by source/country, tracking-link builder | 2026-10-05, local |
| Branding: teal logo on site, favicon, app | ✅ Emails still use the text wordmark "TheONE / SUPER APP", not the logo image | 2026-10-05 |
| "Business partner" wording everywhere | ✅ Site, emails, Stripe plan names, app, assistant | 2026-10-01 |

**iOS app:** on TestFlight as "TheONE SUPER APP" (`com.theone.superapp`),
iPhone only, iOS 17+. Sign-in, AI assistant, Discover, Messages, Profile all
work against production. Logo on launch screen, sign-in and every tab.

---

## Open

### Needs something from the client
- [ ] **Stripe Tax registration (Spain, and OSS if applicable).** Managed
      Payments is off since 2026-10-06, so TheONE is the seller and VAT is
      calculated by Stripe Tax, which shows **0 € VAT on invoices until a
      registration is entered** (Stripe → Tax → Registrations). Customers pay
      the same either way, as prices include VAT. Accountant to confirm.
- [ ] **Re-test payment without Managed Payments:** the first test sign-up
      (gero.walther@gmail.com, 1 € under Managed Payments) was cancelled and
      removed from the site on 2026-10-05; its Stripe customer and invoice stay
      for bookkeeping. Next test: apply fresh, approve with Early Access, pay
      1 €, confirm the bank statement reads THEONE SUPER APP.
- [ ] **Delete test data?** All 20 pending applications in the queue are fake
      (`@example.com`, `bergklinik-davos.example`), plus 5 "Zurich Dental 17…"
      business partner listings and 10 `tester…` accounts that members see in
      the app. Needs an explicit yes; deletion is permanent.

### Before launch
- [ ] Stripe customer portal: replace the placeholder privacy-policy link
      (currently the homepage) once the privacy page exists.
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
- [ ] Logo image in the email header (currently the text wordmark).
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
- **Plans** (confirmed 2026-10-06): Member €10 first month then €49/month;
  Business Partner Large €9,400/year and Small €5,000/year (tier chosen at
  approval); Early Access €1/month. **All prices are final, VAT included**
  (members 2026-10-06, business partners 2026-10-06).
- **Early Access is a plan, chosen by staff at approval** (2026-10-05), not
  something applicants pick: access is by approval, so price is too.
- **Stripe Managed Payments turned off** (2026-10-06, was on from 2026-10-05):
  under it Stripe's Link was the seller and statements read `LINK.COM*`. Now
  TheONE is the seller, statements read `THEONE SUPER APP`, VAT is worked out
  by Stripe Tax, and TheONE files it. Products keep tax code `txcd_10000000`.
  The one subscription from before (`gwintech`, 1 €) stays under Managed Payments.
- **"Business partner" / "Geschäftspartner"** for the audience; "partnership",
  "Ansprechpartner" and "partner businesses" keep their words.

---

## How to

| Task | How |
|---|---|
| Deploy the website | Push to `main`. If no deploy appears within a few minutes, from the repo root: `VERCEL_ORG_ID=team_sjSRYBlwKA0hBcvyNRKc97Xs VERCEL_PROJECT_ID=prj_3NwQBjmyCndsGhJIcpG57T00vQfu npx vercel deploy --prod --yes` |
| Ship an iOS build to TestFlight | `xcodebuild … archive -allowProvisioningUpdates`, then `xcodebuild -exportArchive` with method `app-store-connect`, destination `upload`, team `W67AW8RFW4`. The build number bumps itself. |
| Run locally | `pnpm dev` in `apps/landing` (port 5656). ⚠ Local uses the **production database, real email and the live Stripe key**: a local checkout is a real one. |
| Admin login | `/de/login`, username `admin` / shop@theone-superapp.com (since 2026-10-05; the old admin `gero` was removed so gero.walther@gmail.com can be a normal member). Forgotten password: `/de/forgot-password`. |
| Create an admin | Add the email to `ADMIN_EMAILS` (local `.env.local` and Vercel), then `pnpm admin:create <email> <username> <random password>`; the person sets their own password via `/de/forgot-password`. |
| Make a tracking link | Admin → Analytics → Tracking link. |

## Services

| Service | Used for | Account |
|---|---|---|
| Vercel | Hosting, project `theone-superapp` | gerowalthers-projects |
| MongoDB Atlas | Database, project "theonesuperapp", `cluster0` | Rayquaza's Org |
| Resend | Email, domain `theone-superapp.com` (EU) | verified |
| Stripe | Payments, **live**, TheONE is seller (Managed Payments off), Stripe Tax on. Restricted key (no payouts). Webhook `we_1UNF7o…` → www/api/stripe/webhook | account acct_1UNDa0…, Spain, EUR |
| Anthropic | AI assistant | key set in production |
| easyname | Domain + DNS | — |
| App Store Connect | iOS app, team `W67AW8RFW4` | — |
