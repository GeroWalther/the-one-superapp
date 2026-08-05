import "server-only";

/**
 * Transactional email, behind an interface so no build phase blocks on a
 * provider key. Without `RESEND_API_KEY` the console driver renders every
 * message to the server log — the flows stay fully testable, and switching to
 * real delivery is a matter of setting two environment variables.
 */

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Surfaces in the console driver so dev logs are readable. */
  tag?: string;
};

export interface Mailer {
  readonly name: string;
  send(message: MailMessage): Promise<void>;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";

class ConsoleMailer implements Mailer {
  readonly name = "console";

  async send(message: MailMessage): Promise<void> {
    console.info(
      [
        "",
        "──────────── ✉  email (console driver — not delivered) ────────────",
        `to:      ${message.to}`,
        `subject: ${message.subject}`,
        message.tag ? `tag:     ${message.tag}` : null,
        "",
        message.text,
        "───────────────────────────────────────────────────────────────────",
        "",
      ]
        .filter((line) => line !== null)
        .join("\n"),
    );
  }
}

class ResendMailer implements Mailer {
  readonly name = "resend";

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: MailMessage): Promise<void> {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.tag ? { tags: [{ name: "kind", value: message.tag }] } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Resend rejected the message (${response.status}): ${detail.slice(0, 400)}`,
      );
    }
  }
}

let cached: Mailer | undefined;

export function getMailer(): Mailer {
  if (cached) return cached;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (apiKey && from) {
    cached = new ResendMailer(apiKey, from);
  } else {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[mail] RESEND_API_KEY/MAIL_FROM are unset — emails are being logged, not delivered.",
      );
    }
    cached = new ConsoleMailer();
  }

  return cached;
}

/**
 * Email must never take a user-facing action down with it. A member whose
 * application saved but whose confirmation email bounced is in a far better
 * state than one whose submission was rejected because Resend had a bad minute.
 */
export async function sendMailSafely(message: MailMessage): Promise<boolean> {
  try {
    await getMailer().send(message);
    return true;
  } catch (error) {
    console.error(`[mail] failed to send "${message.subject}":`, error);
    return false;
  }
}
