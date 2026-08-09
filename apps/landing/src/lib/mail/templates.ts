import "server-only";
import type { MailMessage } from "./mailer";

/**
 * Email copy in both site languages. Hand-written table layout with inline
 * styles — email clients ignore stylesheets and most of flexbox, so the fancy
 * CSS the website uses does not survive here.
 *
 * Every template returns a plain-text part as well. Some clients render it,
 * spam filters read it, and the console driver prints it during development.
 */

export type Locale = "de" | "en";

const PAGE = "#f2f5f6";
const PANEL = "#ffffff";
const INK = "#2b3440";
const INK_SOFT = "#5a6572";
const INK_FAINT = "#8b95a1";
const ACCENT = "#2e9ca8";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(options: {
  preheader: string;
  eyebrow: string;
  heading: string;
  paragraphs: string[];
  cta?: { label: string; url: string };
  footNote?: string;
}): string {
  const { preheader, eyebrow, heading, paragraphs, cta, footNote } = options;

  const body = paragraphs
    .map(
      (text) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${INK_SOFT};">${text}</p>`,
    )
    .join("");

  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
         <tr><td style="border-radius:999px;background:${ACCENT};">
           <a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(cta.label)}</a>
         </td></tr>
       </table>`
    : "";

  const foot = footNote
    ? `<p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:${INK_FAINT};">${footNote}</p>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${PAGE};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE};padding:36px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${PANEL};border:1px solid #e2e8ea;border-radius:20px;">
      <tr><td style="padding:36px 34px 34px;">
        <p style="margin:0 0 22px;font-size:19px;letter-spacing:0.02em;color:${INK};">
          <span style="font-weight:300;">The</span><span style="font-weight:600;color:${ACCENT};">ONE</span><span style="display:block;margin-top:3px;font-size:8px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;color:${INK_FAINT};">Super App</span>
        </p>
        <p style="margin:0 0 10px;font-size:10px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;color:${ACCENT};">${escapeHtml(eyebrow)}</p>
        <h1 style="margin:0 0 20px;font-size:26px;line-height:1.25;font-weight:400;color:${INK};">${escapeHtml(heading)}</h1>
        ${body}
        ${button}
        ${foot}
      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:11px;color:${INK_FAINT};">© 2026 TheONE Super App</p>
  </td></tr>
</table>
</body></html>`;
}

function plain(heading: string, paragraphs: string[], cta?: { label: string; url: string }): string {
  return [
    heading,
    "",
    ...paragraphs.map((p) => p.replace(/<[^>]+>/g, "")),
    ...(cta ? ["", `${cta.label}: ${cta.url}`] : []),
    "",
    "— TheONE",
  ].join("\n");
}

/* ========================================================================== *
 * 1. Application received
 * ========================================================================== */

export function applicationReceivedEmail(input: {
  locale: Locale;
  to: string;
  name: string;
  type: "member" | "partner";
}): MailMessage {
  const de = input.locale === "de";
  const name = escapeHtml(input.name);

  const eyebrow = de ? "Bewerbung eingegangen" : "Application received";
  const heading = de ? `Danke, ${input.name}.` : `Thank you, ${input.name}.`;
  const paragraphs = de
    ? [
        `Wir haben Ihre ${input.type === "partner" ? "Partner-" : "Mitglieds-"}Bewerbung bei TheONE erhalten und prüfen sie persönlich.`,
        "Jede Bewerbung wird einzeln geprüft — deshalb dauert es ein paar Tage. Sie hören in jedem Fall von uns, ob wir Sie aufnehmen können oder nicht.",
        `Bis dahin ist nichts weiter zu tun, ${name}.`,
      ]
    : [
        `We have received your ${input.type === "partner" ? "partner" : "membership"} application to TheONE and are reviewing it personally.`,
        "Every application is read individually, which is why it takes a few days. You will hear from us either way — whether or not we can offer you a place.",
        `Nothing further is needed from you in the meantime, ${name}.`,
      ];

  return {
    to: input.to,
    tag: "application-received",
    subject: de
      ? "Ihre Bewerbung bei TheONE ist eingegangen"
      : "Your TheONE application has been received",
    html: layout({ preheader: eyebrow, eyebrow, heading, paragraphs }),
    text: plain(heading, paragraphs),
  };
}

/* ========================================================================== *
 * 2. Approved — set your credentials
 * ========================================================================== */

export function applicationApprovedEmail(input: {
  locale: Locale;
  to: string;
  name: string;
  activationUrl: string;
  freeMonths: number;
  expiresInDays: number;
}): MailMessage {
  const de = input.locale === "de";

  const eyebrow = de ? "Aufgenommen" : "Approved";
  const heading = de
    ? `Willkommen bei TheONE, ${input.name}.`
    : `Welcome to TheONE, ${input.name}.`;

  const freeLine = input.freeMonths
    ? de
      ? `<strong style="color:${ACCENT};">Ihre ersten ${input.freeMonths} Monate sind kostenfrei.</strong>`
      : `<strong style="color:${ACCENT};">Your first ${input.freeMonths} months are free.</strong>`
    : null;

  const paragraphs = (
    de
      ? [
          "Ihre Bewerbung wurde geprüft und angenommen.",
          freeLine,
          "Der nächste Schritt: Legen Sie Ihren Benutzernamen und Ihr Passwort fest. Danach wählen Sie Ihre Zahlungsmethode und Ihr Zugang ist aktiv.",
        ]
      : [
          "Your application has been reviewed and accepted.",
          freeLine,
          "Next: choose your username and password. After that you select a payment method and your access goes live.",
        ]
  ).filter((line): line is string => Boolean(line));

  const cta = {
    label: de ? "Zugangsdaten festlegen" : "Set your credentials",
    url: input.activationUrl,
  };

  const footNote = de
    ? `Dieser Link ist ${input.expiresInDays} Tage gültig und kann nur einmal verwendet werden.`
    : `This link is valid for ${input.expiresInDays} days and can be used only once.`;

  return {
    to: input.to,
    tag: "application-approved",
    subject: de
      ? "Ihr Zugang zu TheONE wurde freigegeben"
      : "Your TheONE access has been approved",
    html: layout({ preheader: eyebrow, eyebrow, heading, paragraphs, cta, footNote }),
    text: plain(heading, paragraphs, cta) + `\n\n${footNote}`,
  };
}

/* ========================================================================== *
 * 3. Declined
 * ========================================================================== */

export function applicationDeclinedEmail(input: {
  locale: Locale;
  to: string;
  name: string;
  applicantMessage?: string;
}): MailMessage {
  const de = input.locale === "de";

  const eyebrow = de ? "Entscheidung" : "Decision";
  const heading = de ? `Hallo ${input.name},` : `Hello ${input.name},`;

  const paragraphs = [
    de
      ? "vielen Dank für Ihr Interesse an TheONE. Nach sorgfältiger Prüfung können wir Ihre Bewerbung derzeit leider nicht annehmen."
      : "thank you for your interest in TheONE. After careful review we are unable to accept your application at this time.",
    ...(input.applicantMessage
      ? [`<em style="color:${INK};">${escapeHtml(input.applicantMessage)}</em>`]
      : []),
    de
      ? "Wir bitten um Ihr Verständnis, dass wir diese Entscheidung nicht weiter kommentieren."
      : "We ask for your understanding that we do not comment further on this decision.",
  ];

  return {
    to: input.to,
    tag: "application-declined",
    subject: de
      ? "Ihre Bewerbung bei TheONE"
      : "Your TheONE application",
    html: layout({ preheader: eyebrow, eyebrow, heading, paragraphs }),
    text: plain(heading, paragraphs),
  };
}

/* ========================================================================== *
 * 4. Invitation (admin-issued or member referral)
 * ========================================================================== */

export function invitationEmail(input: {
  locale: Locale;
  to: string;
  kind: "admin" | "referral";
  role: "member" | "partner";
  inviterName?: string;
  inviteUrl: string;
  freeMonths: number;
  expiresInDays: number;
}): MailMessage {
  const de = input.locale === "de";
  const isAdmin = input.kind === "admin";

  const eyebrow = de ? "Einladung" : "Invitation";
  const heading = de
    ? isAdmin
      ? "Sie sind eingeladen."
      : `${input.inviterName ?? "Ein Mitglied"} lädt Sie ein.`
    : isAdmin
      ? "You have been invited."
      : `${input.inviterName ?? "A member"} is inviting you.`;

  const roleWord = de
    ? input.role === "partner"
      ? "Partner"
      : "Mitglied"
    : input.role === "partner"
      ? "partner"
      : "member";

  const paragraphs = (
    de
      ? [
          isAdmin
            ? `TheONE lädt Sie persönlich als ${roleWord} ein. Zugang gibt es sonst nur auf Bewerbung.`
            : `${escapeHtml(input.inviterName ?? "Ein Mitglied")} hat Sie als ${roleWord} für TheONE vorgeschlagen.`,
          input.freeMonths
            ? `<strong style="color:${ACCENT};">Ihre ersten ${input.freeMonths} Monate sind kostenfrei.</strong>`
            : null,
          isAdmin
            ? "Füllen Sie das kurze Aufnahmeformular aus — Ihr Zugang wird direkt freigegeben."
            : "Füllen Sie das Aufnahmeformular aus. Ihre Bewerbung wird anschließend von uns geprüft.",
        ]
      : [
          isAdmin
            ? `TheONE is inviting you personally as a ${roleWord}. Access is otherwise by application only.`
            : `${escapeHtml(input.inviterName ?? "A member")} has put you forward as a ${roleWord} of TheONE.`,
          input.freeMonths
            ? `<strong style="color:${ACCENT};">Your first ${input.freeMonths} months are free.</strong>`
            : null,
          isAdmin
            ? "Complete the short intake form and your access opens straight away."
            : "Complete the intake form. Your application will then be reviewed by us.",
        ]
  ).filter((line): line is string => Boolean(line));

  const cta = {
    label: de ? "Einladung annehmen" : "Accept invitation",
    url: input.inviteUrl,
  };

  const footNote = de
    ? `Diese Einladung ist ${input.expiresInDays} Tage gültig.`
    : `This invitation is valid for ${input.expiresInDays} days.`;

  return {
    to: input.to,
    tag: `invitation-${input.kind}`,
    subject: de ? "Ihre Einladung zu TheONE" : "Your invitation to TheONE",
    html: layout({ preheader: eyebrow, eyebrow, heading, paragraphs, cta, footNote }),
    text: plain(heading, paragraphs, cta) + `\n\n${footNote}`,
  };
}

/* ========================================================================== *
 * 5. Password reset
 * ========================================================================== */

export function passwordResetEmail(input: {
  locale: Locale;
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
}): MailMessage {
  const de = input.locale === "de";

  const eyebrow = de ? "Passwort" : "Password";
  const heading = de ? "Passwort zurücksetzen" : "Reset your password";
  const paragraphs = de
    ? [
        "Sie haben angefordert, Ihr Passwort für TheONE zurückzusetzen.",
        "Wenn Sie das nicht waren, können Sie diese E-Mail ignorieren — Ihr Passwort bleibt unverändert.",
      ]
    : [
        "You asked to reset your TheONE password.",
        "If this was not you, you can ignore this email — your password will not change.",
      ];

  const cta = {
    label: de ? "Neues Passwort setzen" : "Set a new password",
    url: input.resetUrl,
  };

  const footNote = de
    ? `Dieser Link läuft in ${input.expiresInMinutes} Minuten ab.`
    : `This link expires in ${input.expiresInMinutes} minutes.`;

  return {
    to: input.to,
    tag: "password-reset",
    subject: de ? "TheONE — Passwort zurücksetzen" : "TheONE — reset your password",
    html: layout({ preheader: eyebrow, eyebrow, heading, paragraphs, cta, footNote }),
    text: plain(heading, paragraphs, cta) + `\n\n${footNote}`,
  };
}

/* ========================================================================== *
 * 6. Referral reward earned
 * ========================================================================== */

export function referralRewardEmail(input: {
  locale: Locale;
  to: string;
  name: string;
  referrals: number;
  totalFreeMonths: number;
  addedFreeMonths: number;
}): MailMessage {
  const de = input.locale === "de";

  const eyebrow = de ? "Empfehlung" : "Referral";
  const heading = de
    ? `${input.addedFreeMonths} Monate geschenkt, ${input.name}.`
    : `${input.addedFreeMonths} months on us, ${input.name}.`;

  const paragraphs = de
    ? [
        `${input.referrals} von Ihnen eingeladene Personen sind jetzt aktive Mitglieder von TheONE.`,
        `Dafür schreiben wir Ihnen <strong style="color:${ACCENT};">${input.addedFreeMonths} weitere kostenfreie Monate</strong> gut — insgesamt ${input.totalFreeMonths}.`,
        "Die Gutschrift ist bereits auf Ihrem Konto hinterlegt und verlängert Ihre nächste Abrechnung.",
      ]
    : [
        `${input.referrals} people you invited are now active on TheONE.`,
        `We have credited you <strong style="color:${ACCENT};">${input.addedFreeMonths} more free months</strong> — ${input.totalFreeMonths} in total.`,
        "The credit is already on your account and pushes back your next billing date.",
      ];

  return {
    to: input.to,
    tag: "referral-reward",
    subject: de
      ? `${input.addedFreeMonths} kostenfreie Monate für Ihre Empfehlungen`
      : `${input.addedFreeMonths} free months for your referrals`,
    html: layout({ preheader: eyebrow, eyebrow, heading, paragraphs }),
    text: plain(heading, paragraphs),
  };
}
