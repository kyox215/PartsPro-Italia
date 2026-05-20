import { addRmaAttachment, generateRmaNumber, recordRmaEvent } from "@/lib/rma-workflow";
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

export async function createAccountRma({
  orderId,
  sku,
  quantity,
  issueType,
  description,
  user,
}: {
  orderId: string;
  sku: string;
  quantity: number;
  issueType: string;
  description?: string | null;
  user: AccountAuthUser;
}) {
  const order = await loadOwnedOrder(orderId, user.id);
  if (!order) throw new Error("Order not found.");
  if (order.payment_status !== "paid") {
    throw new Error("RMA can be opened only after payment is confirmed.");
  }
  if (!["paid", "processing", "shipped", "completed"].includes(order.status)) {
    throw new Error("This order status is not eligible for RMA.");
  }

  const item = (order.order_items ?? []).find((candidate) => candidate.sku === sku);
  if (!item) throw new Error("SKU is not part of this order.");

  const purchasedQty = Number(item.quantity ?? 0);
  const existingQty = await getExistingRmaQuantity({
    userId: user.id,
    orderNumber: order.id,
    sku,
  });

  if (quantity > purchasedQty - existingQty) {
    throw new Error("RMA quantity exceeds the remaining eligible quantity.");
  }

  const supabase = getSupabaseAdminClient();
  const rmaId = crypto.randomUUID();
  const rmaNumber = generateRmaNumber(rmaId);
  const { error } = await supabase.from("rmas").insert({
    id: rmaId,
    rma_number: rmaNumber,
    profile_id: user.id,
    order_id: order.id,
    status: "submitted",
    order_number: order.id,
    sku,
    quantity,
    issue_type: issueType,
    description: description || null,
  });

  if (error) throw new Error(error.message);

  await recordRmaEvent({
    supabase,
    rmaId,
    eventType: "rma_submitted",
    title: "RMA submitted",
    body: description || "Customer submitted a return request.",
    actorProfileId: user.id,
    metadata: {
      rmaNumber,
      orderId: order.id,
      sku,
      quantity,
      issueType,
    },
  });

  await recordOrderEvent({
    orderId: order.id,
    eventType: "rma_submitted",
    title: "RMA submitted for order item",
    body: `${rmaNumber} / ${sku} x ${quantity}`,
    actorProfileId: user.id,
    metadata: {
      rmaId,
      rmaNumber,
      sku,
      quantity,
    },
  });

  return { rmaId, rmaNumber };
}

export async function recordAccountRmaMessage({
  rmaId,
  user,
  message,
}: {
  rmaId: string;
  user: AccountAuthUser;
  message: string;
}) {
  const rma = await loadOwnedRma(rmaId, user.id);
  if (!rma) throw new Error("RMA not found.");

  await recordRmaEvent({
    rmaId,
    eventType: "rma_customer_message",
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

export async function addAccountRmaAttachment({
  rmaId,
  user,
  label,
  url,
  note,
  locale,
}: {
  rmaId: string;
  user: AccountAuthUser;
  label: string;
  url: string;
  note?: string | null;
  locale?: string | null;
}) {
  const rma = await loadOwnedRma(rmaId, user.id);
  if (!rma) throw new Error("RMA not found.");

  return addRmaAttachment({
    rmaId,
    label,
    url,
    note,
    actorProfileId: user.id,
    locale,
  });
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

async function loadOwnedRma(rmaId: string, userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rmas")
    .select("id, profile_id")
    .eq("id", rmaId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || data.profile_id !== userId) return null;
  return data;
}

async function getExistingRmaQuantity({
  userId,
  orderNumber,
  sku,
}: {
  userId: string;
  orderNumber: string;
  sku: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rmas")
    .select("quantity, status")
    .eq("profile_id", userId)
    .eq("order_number", orderNumber)
    .eq("sku", sku);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((rma) => rma.status !== "rejected")
    .reduce((sum, rma) => sum + Number(rma.quantity ?? 0), 0);
}

function normalizePaymentMethod(value: string | null | undefined): PaymentMethod {
  if (value === "stripe" || value === "cash" || value === "bank_transfer") {
    return value;
  }
  return "bank_transfer";
}
