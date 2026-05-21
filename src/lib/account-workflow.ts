import {
  recordOrderEvent,
  recordOrderPaymentRecord,
  releaseOrderReservations,
  type PaymentMethod,
} from "@/lib/order-workflow";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type AccountAuthUser = {
  id: string;
  email?: string;
};

type OwnedOrder = {
  id: string;
  profile_id: string | null;
  status: string;
  payment_method: string;
  payment_status: string | null;
  fulfillment_status: string | null;
  total: number | string | null;
  currency: string | null;
  released_at?: string | null;
  order_items?: Array<{
    sku: string;
    quantity: number;
    name?: string | null;
  }> | null;
};

export async function cancelAccountOrder({
  orderId,
  user,
}: {
  orderId: string;
  user: AccountAuthUser;
}) {
  const order = await loadOwnedOrder(orderId, user.id);
  if (!order) throw new Error("Order not found.");
  if (order.payment_status === "paid" || order.payment_status === "refunded") {
    throw new Error("Paid orders cannot be cancelled from the account area.");
  }
  if (order.status === "cancelled") {
    return { cancelled: true, alreadyCancelled: true };
  }
  if (order.released_at) {
    throw new Error("This order reservation has already been released.");
  }

  await releaseOrderReservations({
    orderId,
    paymentStatus: "cancelled",
    status: "cancelled",
    note: "Customer cancelled unpaid order",
    actorProfileId: user.id,
  });

  return { cancelled: true, alreadyCancelled: false };
}

export async function submitAccountOrderPaymentProof({
  orderId,
  user,
  providerReference,
  proofUrl,
  proofLabel,
  note,
}: {
  orderId: string;
  user: AccountAuthUser;
  providerReference?: string | null;
  proofUrl?: string | null;
  proofLabel?: string | null;
  note?: string | null;
}) {
  const order = await loadOwnedOrder(orderId, user.id);
  if (!order) throw new Error("Order not found.");
  if (order.status === "cancelled") {
    throw new Error("Cancelled orders cannot receive payment proofs.");
  }
  if (order.payment_status === "paid" || order.payment_status === "refunded") {
    throw new Error("This order payment is already closed.");
  }

  const method = normalizePaymentMethod(order.payment_method);
  if (method === "stripe") {
    throw new Error("Stripe payments must be completed through checkout.");
  }

  const amount = Number(order.total ?? 0);
  const currency = order.currency ?? "EUR";
  await recordOrderPaymentRecord({
    orderId,
    paymentMethod: method,
    paymentStatus: order.payment_status || (method === "cash" ? "pending_cash" : "pending_bank_transfer"),
    amount,
    currency,
    provider: "customer",
    providerReference: providerReference || null,
    proofUrl: proofUrl || null,
    proofLabel: proofLabel || null,
    recordedBy: user.id,
    note: note || "Customer submitted payment proof.",
    metadata: {
      source: "customer_payment_proof",
      customerEmail: user.email ?? null,
    },
  });

  await recordOrderEvent({
    orderId,
    eventType: "payment_proof_submitted",
    title: "Customer submitted payment proof",
    body: note || providerReference || proofLabel || "Payment proof submitted by customer.",
    actorProfileId: user.id,
    metadata: {
      paymentMethod: method,
      providerReference: providerReference || null,
      proofUrl: proofUrl || null,
      proofLabel: proofLabel || null,
    },
  });

  return { submitted: true };
}

export async function recordAccountOrderMessage({
  orderId,
  user,
  message,
}: {
  orderId: string;
  user: AccountAuthUser;
  message: string;
}) {
  const order = await loadOwnedOrder(orderId, user.id);
  if (!order) throw new Error("Order not found.");

  await recordOrderEvent({
    orderId,
    eventType: "customer_message",
    title: "Customer message",
    body: message,
    actorProfileId: user.id,
    metadata: {
      source: "account_workspace",
      customerEmail: user.email ?? null,
    },
  });

  return { recorded: true };
}

export async function markAccountNotificationsRead({
  user,
  notificationId,
}: {
  user: AccountAuthUser;
  notificationId?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const query = supabase
    .from("notification_events")
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", user.id)
    .is("read_at", null);

  const { error } = notificationId
    ? await query.eq("id", notificationId)
    : await query;

  if (error) throw new Error(error.message);
  return { read: true };
}

export async function loadOwnedOrder(orderId: string, userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, profile_id, status, payment_method, payment_status, fulfillment_status, total, currency, released_at, order_items ( sku, quantity, name )",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || data.profile_id !== userId) return null;
  return data as OwnedOrder;
}

function normalizePaymentMethod(value: string | null | undefined): PaymentMethod {
  if (value === "stripe" || value === "cash" || value === "bank_transfer") {
    return value;
  }
  return "bank_transfer";
}
