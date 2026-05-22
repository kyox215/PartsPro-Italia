import type { CartInputItem } from "@/lib/cart-quote";
import {
  adminOrderV2RpcNames,
  buildAdminOrderV2CreatePayload,
  type AdminOrderV2GenericData,
} from "@/admin/repositories/order-v2-contracts";
import { callAdminOrderV2Rpc } from "@/admin/repositories/order-v2-rpc";
import {
  addOrderPaymentProof,
  confirmManualPayment,
  createSupabaseOrderWithReservations,
  extendOrderReservation,
  getInitialOrderStatus,
  getPaymentStatus,
  getReservationExpiry,
  issueOrderRefund,
  loadSupabaseOrderLines,
  markOrderPaid,
  recordOrderEvent,
  recordOrderPaymentRecord,
  releaseExpiredReservations,
  releaseOrderReservations,
  syncStripeRefundStatus,
  updateOrderShipment,
  type PaymentMethod,
  type RefundReason,
} from "@/lib/order-workflow";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type {
  OrderLine,
  PaymentMethod,
  RefundReason,
} from "@/lib/order-workflow";

export const orderTransactionV2RpcNames = adminOrderV2RpcNames;

export type OrderPaymentProofInput = {
  amount: number;
  actorProfileId?: string | null;
  locale?: string | null;
  note?: string | null;
  orderId: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  proofLabel?: string | null;
  proofUrl?: string | null;
  providerReference?: string | null;
};

export type OrderShipmentInput = {
  actorProfileId?: string | null;
  customerNote?: string | null;
  locale?: string | null;
  orderId: string;
  shipmentNote?: string | null;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
};

export type OrderRefundInput = {
  actorProfileId?: string | null;
  amount: number;
  locale?: string | null;
  note?: string | null;
  orderId: string;
  providerReference?: string | null;
  reason?: RefundReason;
};

export function getOrderTransactionClient() {
  return getSupabaseAdminClient();
}

export function getCheckoutPaymentStatus(paymentMethod: PaymentMethod) {
  return getPaymentStatus(paymentMethod);
}

export function getCheckoutInitialOrderStatus(paymentMethod: PaymentMethod) {
  return getInitialOrderStatus(paymentMethod);
}

export function getCheckoutReservationExpiry(now = new Date()) {
  return getReservationExpiry(now);
}

export async function loadCheckoutOrderLines(
  items: CartInputItem[],
  useB2BPrice: boolean,
) {
  return loadSupabaseOrderLines(items, useB2BPrice);
}

export async function createOrderReservation(
  input: Parameters<typeof createSupabaseOrderWithReservations>[0],
) {
  return createSupabaseOrderWithReservations(input);
}

export function buildCreateOrderReservationV2Payload(
  input: Parameters<typeof createSupabaseOrderWithReservations>[0],
) {
  return buildAdminOrderV2CreatePayload(input);
}

export async function updateOrderStatus(orderId: string, status: string) {
  if (isOrderV2RpcEnabled()) {
    return callAdminOrderV2Rpc<AdminOrderV2GenericData>(
      adminOrderV2RpcNames.updateStatus,
      {
        order_id: orderId,
        status,
      },
    );
  }

  const supabase = getOrderTransactionClient();
  const { error } = await supabase
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
  return { orderId, status };
}

export async function updateOrderStripeCheckoutSession({
  orderId,
  stripeCheckoutSessionId,
  stripePaymentIntentId,
}: {
  orderId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string | null;
}) {
  if (isOrderV2RpcEnabled()) {
    return callAdminOrderV2Rpc<AdminOrderV2GenericData>(
      adminOrderV2RpcNames.updateStripeCheckout,
      {
        order_id: orderId,
        stripe_checkout_session_id: stripeCheckoutSessionId,
        stripe_payment_intent_id: stripePaymentIntentId ?? null,
      },
    );
  }

  const supabase = getOrderTransactionClient();
  const { error } = await supabase
    .from("orders")
    .update({
      stripe_checkout_session_id: stripeCheckoutSessionId,
      stripe_payment_intent_id: stripePaymentIntentId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
  return { orderId, stripeCheckoutSessionId, stripePaymentIntentId: stripePaymentIntentId ?? null };
}

export async function confirmOrderManualPayment({
  actorProfileId,
  expectedMethod,
  locale,
  orderId,
}: {
  actorProfileId?: string | null;
  expectedMethod: "cash" | "bank_transfer";
  locale?: string | null;
  orderId: string;
}) {
  if (isOrderV2RpcEnabled()) {
    return callAdminOrderV2Rpc<AdminOrderV2GenericData>(
      adminOrderV2RpcNames.confirmPayment,
      {
        actor_profile_id: actorProfileId ?? null,
        expected_method: expectedMethod,
        locale: locale ?? null,
        note:
          expectedMethod === "cash"
            ? "Cash payment confirmed by admin"
            : "Bank transfer confirmed by admin",
        order_id: orderId,
      },
    );
  }

  await confirmManualPayment({
    orderId,
    expectedMethod,
    actorProfileId,
    locale,
  });
  return { orderId, paymentMethod: expectedMethod, paymentStatus: "paid" };
}

export async function markOrderStripePaymentPaid(
  input: Parameters<typeof markOrderPaid>[0],
) {
  await markOrderPaid(input);
  return { orderId: input.orderId, paymentStatus: "paid" };
}

export async function addOrderPaymentProofRecord(input: OrderPaymentProofInput) {
  if (isOrderV2RpcEnabled()) {
    return callAdminOrderV2Rpc<AdminOrderV2GenericData>(
      adminOrderV2RpcNames.addPaymentProof,
      {
        amount: input.amount,
        currency: "EUR",
        note: input.note ?? null,
        order_id: input.orderId,
        payment_method: input.paymentMethod,
        payment_status: input.paymentStatus,
        proof_label: input.proofLabel ?? null,
        proof_url: input.proofUrl ?? null,
        provider: input.paymentMethod === "stripe" ? "stripe" : "manual",
        provider_reference: input.providerReference ?? null,
        recorded_by: input.actorProfileId ?? null,
        timeline_body:
          input.note ??
          input.proofLabel ??
          "Admin added a payment proof/reference.",
      },
    );
  }

  return addOrderPaymentProof(input);
}

export async function recordOrderPayment(
  input: Parameters<typeof recordOrderPaymentRecord>[0],
) {
  return recordOrderPaymentRecord(input);
}

export async function updateOrderShipmentRecord(input: OrderShipmentInput) {
  if (isOrderV2RpcEnabled()) {
    return callAdminOrderV2Rpc<AdminOrderV2GenericData>(
      adminOrderV2RpcNames.updateShipment,
      {
        actor_profile_id: input.actorProfileId ?? null,
        customer_note: input.customerNote ?? null,
        locale: input.locale ?? null,
        order_id: input.orderId,
        shipment_note: input.shipmentNote ?? null,
        shipping_carrier: input.shippingCarrier ?? null,
        tracking_number: input.trackingNumber ?? null,
        tracking_url: input.trackingUrl ?? null,
      },
    );
  }

  return updateOrderShipment(input);
}

export async function issueOrderRefundRecord(input: OrderRefundInput) {
  return issueOrderRefund(input);
}

export async function extendOrderReservationWindow(
  orderId: string,
  actorProfileId?: string | null,
) {
  return extendOrderReservation(orderId, actorProfileId);
}

export async function releaseOrderReservation(
  input: Parameters<typeof releaseOrderReservations>[0],
) {
  return releaseOrderReservations(input);
}

export async function releaseExpiredOrderReservations() {
  return releaseExpiredReservations();
}

export async function syncOrderStripeRefundStatus(
  input: Parameters<typeof syncStripeRefundStatus>[0],
) {
  return syncStripeRefundStatus(input);
}

export async function appendOrderTimelineEvent(
  input: Parameters<typeof recordOrderEvent>[0],
) {
  if (isOrderV2RpcEnabled()) {
    return callAdminOrderV2Rpc<AdminOrderV2GenericData>(
      adminOrderV2RpcNames.appendTimeline,
      {
        order_id: input.orderId,
        event_type: input.eventType,
        title: input.title,
        body: input.body ?? null,
        actor_profile_id: input.actorProfileId ?? null,
        customer_visible: true,
        metadata: input.metadata ?? {},
      },
    );
  }

  return recordOrderEvent(input);
}

export function isOrderV2RpcEnabled() {
  return process.env.ADMIN_ORDER_V2_RPC_ENABLED === "true";
}
