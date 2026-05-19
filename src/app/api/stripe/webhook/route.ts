import { NextResponse } from "next/server";
import { getStripe, hasStripeConfig } from "@/lib/stripe";
import { getSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabase/admin";

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
      const supabase = getSupabaseAdminClient();
      await supabase
        .from("orders")
        .update({
          status: "paid",
          stripe_checkout_session_id: session.id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    }
  }

  return NextResponse.json({ received: true });
}
