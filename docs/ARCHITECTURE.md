# TheONE — Architecture

The reference document for how this platform fits together: the lifecycle an
account moves through, what lives in which collection, how money and invitations
work, and what each phase of the build delivers.

Keep this file current. If a flow below stops matching the code, the file is the
thing that is wrong.

---

## 1. What this is

Two products sharing one backend:

| Surface | What it is | Who uses it |
|---|---|---|
| **Web** (`apps/landing`) | Next.js 16. Public marketing site, enrolment, admin dashboard, account + billing, and the REST API the phone app consumes. | Applicants, admins, and members managing their subscription |
| **iOS** (`apps/ios`) | SwiftUI. AI assistant, partner discovery, in-app chat, profile. | Live members and partners only |

The web app is the only thing that talks to MongoDB, Stripe, Resend, and the
Claude API. **No third-party credential is ever shipped in the iOS binary.**

```
apps/landing/src/
  app/[locale]/       public site, enrolment, admin, account
  app/api/            Stripe webhook + /api/v1 mobile API
  lib/domain.ts       statuses, pricing, referral rules, validation schemas
  lib/db/             collection accessors and indexes
  lib/mail/           mailer interface + console and Resend drivers
apps/ios/             Xcode project (SwiftUI)
docs/ARCHITECTURE.md  this document
```

> The domain vocabulary lives in `apps/landing/src/lib/domain.ts` rather than in
> `packages/shared`. The web app is the only TypeScript consumer — the phone app
> is Swift and talks to it over HTTP — so a separate package would add build
> wiring for a single importer. If a second TS app ever appears, that module is
> the thing to promote.

---

## 2. Account lifecycle

Enrolling is an *application*, not a signup. Nobody picks a password until an
administrator has approved them.

```
                    ┌──────────► declined ──► email + phone hashed into blocklist
                    │                          (cannot ever apply again)
  application ──────┤
    (pending)       │
                    └──────────► approved ──► awaiting_payment ──► active
                                   │              (sets username        │
                                   │               + password)          │
                                   │                                    ├──► past_due
                                   │                                    └──► canceled
                                   │
        admin-issued invitations skip the pending state entirely
        (the admin vetted them by inviting them)
```

**`active` is the only state that can log into the iOS app.** Everything else
gets a clear, specific message rather than a generic auth failure.

`past_due` and `canceled` are driven exclusively by Stripe webhooks — never set
by hand.

---

## 3. Invitations and referrals

Two distinct kinds of invitation. They differ in who vetted the person.

### Admin invitation
An administrator invites someone directly as a member or a partner. Because the
admin issued it, the application **bypasses the approval queue** — the invitee
still completes the intake form (we need their data), but on submit it is
recorded as approved and they go straight to setting credentials.

**Grants the invitee 12 months free.**

### Member / partner referral
Any live account can invite people. Those applications **enter the normal
approval queue** — an existing member vouching for someone is a signal, not a
decision. The admin still approves or declines.

### Referral rewards

The inviter earns free months as their referrals go live:

| Successful referrals | Free months earned |
|---:|---:|
| 5 | 3 |
| 8 | 6 |
| 12 | 12 |

Configured in one place (`REFERRAL_TIERS` in `apps/landing/src/lib/domain.ts`)
so the numbers can change without hunting through code.

Two rules that matter:

- **A referral only counts when the invitee's account reaches `active`.**
  Counting at signup would let anyone farm rewards with throwaway addresses.
- **Tiers are thresholds, not additive.** Reaching 8 referrals means 6 months
  total, not 3 + 6. When a threshold is crossed we grant the *difference*
  between the new tier and what was already granted.

### How free months are actually applied

Free time is tracked on the account as `freeMonthsGranted` and translated into
Stripe at the point of billing:

- **Not yet subscribed** — checkout is created with a trial ending
  `freeMonthsGranted` months out. The card is collected now, first charge lands
  when the free period ends.
- **Already subscribed** — the subscription's `trial_end` is pushed out by the
  granted months, so the next invoice moves rather than issuing a refund.

Every grant is written to `entitlementGrants` with its reason, so "why is this
account free until March" is always answerable.

---

## 4. Data model (MongoDB)

| Collection | Holds | Key indexes |
|---|---|---|
| `applications` | Submitted intake forms. Discriminated on `type: member \| partner`. Review status, admin notes, assigned partner tier, originating invitation. | `email`, `status`, `createdAt` |
| `accounts` | Created at activation. `username`, `email`, `passwordHash`, `role`, `status`, Stripe IDs, `freeMonthsGranted`, `successfulReferrals`. | unique `username`, unique `email` |
| `blocklist` | SHA-256 of normalised email and phone from declined applications. | unique `emailHash`, unique `phoneHash` |
| `invitations` | Invite codes, who issued them, what they grant, redemption state. | unique `code`, `inviterAccountId` |
| `entitlementGrants` | Audit trail of every free-month grant and its reason. | `accountId` |
| `partnerProfiles` | Public partner content: category, description, images, contact, location. | `category`, text index on name/description |
| `savedPartners` | Member → partner bookmarks. | compound `accountId + partnerId` |
| `conversations` / `messages` | In-app chat, member↔member and member↔partner. | `participants`, `conversationId + createdAt` |
| `aiThreads` | AI assistant history per member. | `accountId` |
| `appointmentRequests` | Bookings the assistant made on a member's behalf. | `accountId`, `partnerId` |
| `adminAuditLog` | Who decided what, when, and why. | `actorId`, `createdAt` |
| `refreshTokens` | Revocable iOS refresh tokens (hashed at rest). | `tokenHash`, `accountId` |

### Why email *and* phone in the blocklist
A declined applicant must not be able to reapply with a new email address. Both
are normalised (lowercase / E.164) and hashed before storage, so the blocklist
never holds readable personal data for people who were rejected.

---

## 5. Sessions and auth

Two separate mechanisms, deliberately:

- **Web** — jose-signed JWT in an HttpOnly cookie. Optimistic check in
  `proxy.ts` (cookie signature only, no database), then a real check through the
  Data Access Layer (`src/lib/dal.ts`) on every gated page. The DAL fails
  closed: a database outage bounces people to login rather than 500ing the site.
- **iOS** — short-lived access JWT plus a long-lived, revocable refresh token
  stored hashed. Tokens live in the iOS Keychain, never `UserDefaults`.

Login accepts **username or email**. Admin accounts are seeded by a script, not
self-service.

---

## 6. Money

| Plan | Price | Cadence |
|---|---:|---|
| Member | €49 | monthly |
| Partner — Large (hotels, resorts, clinics, hospitals) | €9,400 | yearly |
| Partner — Small (entrepreneurs, individual practices) | €5,000 | yearly |

The partner tier is chosen by the **admin at approval time**, not self-reported
on the form — otherwise a hotel chain selects the €5,000 tier.

Stripe is the source of truth for subscription state. The webhook is
signature-verified and idempotent; replayed events are no-ops.

---

## 7. The AI assistant

Server-side only, in the web app's API. Model **`claude-opus-5`** via the
official `@anthropic-ai/sdk`, with adaptive thinking, streamed to the phone over
SSE so responses render as they generate. The system prompt and the member's
profile are prompt-cached — they are identical across turns, so caching them
cuts the per-turn cost substantially.

What makes it useful rather than a chatbot is tool use against live platform
data:

| Tool | Effect |
|---|---|
| `get_member_profile` | The member's enrolment answers, so advice is personal |
| `search_partners` | Query the real partner directory by need, category, proximity |
| `get_partner_details` | Full profile and contact details |
| `request_appointment` | Writes an `appointmentRequest` and messages the partner in-app |
| `save_partner` | Bookmarks a partner |

Speech is handled **on-device** on iOS (`SFSpeechRecognizer` for capture,
`AVSpeechSynthesizer` for playback) — no extra vendor, no extra key, no
per-minute cost, and audio never leaves the phone.

---

## 8. Environment variables

| Variable | Used for | Status |
|---|---|---|
| `MONGODB_URI` / `MONGODB_DB` | Database | **outstanding** |
| `SESSION_SECRET` | Web session + mobile JWT signing | set |
| `RESEND_API_KEY` | Transactional email | pending |
| `MAIL_FROM` | Sender address on a verified domain | pending |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Billing | pending |
| `ANTHROPIC_API_KEY` | AI assistant | pending |
| `BLOB_READ_WRITE_TOKEN` | Partner image uploads (Vercel Blob) | pending |
| `ADMIN_EMAILS` | Allowlist for the admin seed script | to set |

Every integration sits behind an interface with a development driver, so no part
of the build blocks waiting for a key. The mailer logs to the console until
`RESEND_API_KEY` exists; billing and the assistant degrade to explicit,
visible "not configured" errors rather than silent failure.

---

## 9. Build phases

| Phase | Delivers |
|---|---|
| 0 | This document, shared types, application schemas, mailer, rate limiting |
| 1 | Member + partner intake forms, blocklist enforcement, confirmation email |
| 2 | Admin dashboard, approve/decline, partner tiering, audit log, admin invitations |
| 3 | Activation tokens, credential setup, login by username/email, password reset |
| 4 | Stripe checkout, webhooks, billing portal, free-month entitlements |
| 5 | Mobile REST API |
| 6 | AI assistant with tool use |
| 7 | iOS app |
| 8 | Deploy and verify |

---

## 10. Known gaps

Deliberately not built yet, and worth tracking:

- **Push notifications** for chat need an Apple Developer account and APNs keys.
- **GDPR.** This platform stores health-adjacent personal data about EU
  residents. A real privacy policy, a data-export path, and a deletion path are
  legal requirements before launch — the footer links are still placeholders.
- **Partner image moderation.** Uploads are currently trusted.
