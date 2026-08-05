import { NextResponse } from "next/server";
import { handleStripeEvent, verifyWebhook } from "@/lib/billing/webhook";

/**
 * Stripe webhook receiver.
 *
 * Signature verification needs the raw body exactly as sent, so this reads
 * `request.text()` — parsing to JSON first and re-serialising changes the bytes
 * and every signature check fails.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  const event = verifyWebhook(rawBody, signature);
  if (!event) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (error) {
    console.error("[stripe] handler failed:", error);
    // 500 asks Stripe to retry — right for a transient failure, and the
    // event-claim table keeps the retry from double-applying anything.
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
