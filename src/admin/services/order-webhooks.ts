import {
  markOrderStripePaymentPaid,
  releaseOrderReservation,
  syncOrderStripeRefundStatus,
} from "@/admin/repositories/order-transactions";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";

type StripePaymentIntentRef = string | { id?: string | null } | null | undefined;

type StripeCheckoutSessionLike = {
  client_reference_id?: string | null;
  id: string;
  metadata?: {
    orderId?: string | null;
  } | null;
  payment_intent?: StripePaymentIntentRef;
};

type StripeRefundLike = {
  failure_reason?: string | null;
  id?: string | null;
  payment_intent?: StripePaymentIntentRef;
  status?: string | null;
};

export async function handleStripeCheckoutCompleted(
  session: StripeCheckoutSessionLike,
) {
  const orderId = getStripeOrderId(session);
  if (!orderId || !hasSupabaseAdminConfig()) return { handled: false };

  await markOrderStripePaymentPaid({
    orderId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: getStripePaymentIntentId(session.payment_intent),
    note: "Stripe checkout completed",
  });

  return { handled: true, orderId };
}

export async function handleStripeCheckoutFailed(
  session: StripeCheckoutSessionLike,
  eventType: "checkout.session.async_payment_failed" | "checkout.session.expired",
) {
  const orderId = getStripeOrderId(session);
  if (!orderId || !hasSupabaseAdminConfig()) return { handled: false };

  await releaseOrderReservation({
    orderId,
    paymentStatus: "failed",
    status: "cancelled",
    note:
      eventType === "checkout.session.expired"
        ? "Stripe checkout expired"
        : "Stripe async payment failed",
  });

  return { handled: true, orderId };
}

export async function handleStripeRefundChanged(refund: StripeRefundLike) {
  if (!refund.id || !hasSupabaseAdminConfig()) return { handled: false };

  const result = await syncOrderStripeRefundStatus({
    stripeRefundId: refund.id,
    stripePaymentIntentId: getStripePaymentIntentId(refund.payment_intent),
    stripeStatus: refund.status,
    failureReason: refund.failure_reason ?? null,
  });

  return { handled: true, refundId: refund.id, result };
}

function getStripeOrderId(session: StripeCheckoutSessionLike) {
  return session.metadata?.orderId ?? session.client_reference_id ?? null;
}

function getStripePaymentIntentId(paymentIntent: StripePaymentIntentRef) {
  if (typeof paymentIntent === "string") return paymentIntent;
  return paymentIntent?.id ?? null;
}
