import { NextResponse } from "next/server";
import {
  markOrderPaid,
  releaseOrderReservations,
  syncStripeRefundStatus,
} from "@/lib/order-workflow";
import { getStripe, hasStripeConfig } from "@/lib/stripe";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";

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
    const session = event.data.object;
    const orderId = session.metadata?.orderId ?? session.client_reference_id;

    if (orderId && hasSupabaseAdminConfig()) {
      await markOrderPaid({
        orderId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        note: "Stripe checkout completed",
      });
    }
  }

  if (
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const session = event.data.object;
    const orderId = session.metadata?.orderId ?? session.client_reference_id;

    if (orderId && hasSupabaseAdminConfig()) {
      await releaseOrderReservations({
        orderId,
        paymentStatus: "failed",
        status: "cancelled",
        note:
          event.type === "checkout.session.expired"
            ? "Stripe checkout expired"
            : "Stripe async payment failed",
      });
    }
  }

  if (event.type === "refund.updated" || event.type === "refund.failed") {
    const refund = event.data.object;
    if (refund.id && hasSupabaseAdminConfig()) {
      await syncStripeRefundStatus({
        stripeRefundId: refund.id,
        stripePaymentIntentId:
          typeof refund.payment_intent === "string"
            ? refund.payment_intent
            : refund.payment_intent?.id ?? null,
        stripeStatus: refund.status,
        failureReason: refund.failure_reason ?? null,
      });
    }
  }

  return NextResponse.json({ received: true });
}
