import { NextResponse } from "next/server";
import {
  handleStripeCheckoutCompleted,
  handleStripeCheckoutFailed,
  handleStripeRefundChanged,
} from "@/admin/services/order-webhooks";
import { getStripe, hasStripeConfig } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasStripeConfig() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 500 },
    );
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid webhook" },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    await handleStripeCheckoutCompleted(event.data.object);
  }

  if (
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    await handleStripeCheckoutFailed(event.data.object, event.type);
  }

  if (event.type === "refund.updated" || event.type === "refund.failed") {
    await handleStripeRefundChanged(event.data.object);
  }

  return NextResponse.json({ received: true });
}
