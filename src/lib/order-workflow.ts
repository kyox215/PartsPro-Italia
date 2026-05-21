import { getStockSourceType, normalizeCartItems, type CartInputItem } from "@/lib/cart-quote";
import { notifyOrderCustomer } from "@/lib/notifications";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { getStripe, hasStripeConfig } from "@/lib/stripe";

export const reservationHours = 24;

export type PaymentMethod = "stripe" | "cash" | "bank_transfer";
export type RefundReason =
  | "duplicate"
  | "fraudulent"
  | "requested_by_customer"
  | "order_cancelled"
  | "other";

export type OrderLine = {
  skuId: string;
  inventoryId: string;
  sku: string;
  name: string;
  quantity: number;
  vatRate: number;
  totals: {
    unitPrice: number;
    subtotal: number;
    vat: number;
  };
  stockSourceType: "stock" | "preorder" | "mixed";
  stockQty: number;
  preorderQty: number;
  preorderLeadTimeMinDays: number | null;
  preorderLeadTimeMaxDays: number | null;
  stockReserved: number;
  incomingReserved: number;
};

type SupabaseClient = ReturnType<typeof getSupabaseAdminClient>;

type SupabaseSkuRow = {
  id: string;
  sku: string;
  moq: number;
  b2b_price: number | string;
  retail_price: number | string;
  vat_rate: number | string;
  preorder_lead_time_min_days: number | null;
  preorder_lead_time_max_days: number | null;
  products:
    | { name_it: string }
    | Array<{ name_it: string }>
    | null;
  inventory:
    | Array<{
        id: string;
        stock_on_hand: number;
        stock_reserved: number;
        incoming_qty: number;
        incoming_reserved: number;
      }>
    | null;
};

type WorkflowOrder = {
  id: string;
  status: string;
  payment_method: string;
  payment_status?: string | null;
  total?: number | string | null;
  currency?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  refund_total?: number | string | null;
  released_at?: string | null;
  order_items?: WorkflowOrderItem[] | null;
};

type WorkflowOrderItem = {
  id: string;
  sku: string;
  quantity: number;
};

export function getPaymentStatus(paymentMethod: PaymentMethod) {
  if (paymentMethod === "stripe") return "pending_card";
  if (paymentMethod === "cash") return "pending_cash";
  return "pending_bank_transfer";
}

export function getInitialOrderStatus(paymentMethod: PaymentMethod) {
  return paymentMethod === "stripe" ? "checkout_created" : "pending_payment";
}

export function getReservationExpiry(now = new Date()) {
  return new Date(now.getTime() + reservationHours * 60 * 60 * 1000);
}

export async function loadSupabaseOrderLines(
  items: CartInputItem[],
  useB2BPrice: boolean,
): Promise<OrderLine[]> {
  const normalizedItems = normalizeCartItems(items);
  if (normalizedItems.length === 0) {
    throw new Error("Cart is empty.");
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("skus")
    .select(
      `
      id,
      sku,
      moq,
      b2b_price,
      retail_price,
      vat_rate,
      preorder_lead_time_min_days,
      preorder_lead_time_max_days,
      products ( name_it ),
      inventory (
        id,
        stock_on_hand,
        stock_reserved,
        incoming_qty,
        incoming_reserved
      )
    `,
    )
    .in(
      "sku",
      normalizedItems.map((item) => item.sku),
    );

  if (error) throw new Error(error.message);

  return normalizedItems.map((item) => {
    const row = (data ?? []).find((candidate) => candidate.sku === item.sku) as
      | SupabaseSkuRow
      | undefined;
    if (!row) throw new Error(`Unknown SKU: ${item.sku}`);
    if (item.quantity < Number(row.moq ?? 1)) {
      throw new Error(`SKU ${item.sku} requires MOQ ${row.moq}`);
    }

    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    const inventory = row.inventory?.[0];
    if (!inventory) throw new Error(`Inventory row missing for SKU ${item.sku}`);

    const availableStock = Math.max(
      Number(inventory.stock_on_hand ?? 0) - Number(inventory.stock_reserved ?? 0),
      0,
    );
    const incomingAvailable = Math.max(
      Number(inventory.incoming_qty ?? 0) - Number(inventory.incoming_reserved ?? 0),
      0,
    );
    const totalAvailable = availableStock + incomingAvailable;

    if (item.quantity > totalAvailable) {
      throw new Error(
        `SKU ${item.sku} has only ${totalAvailable} available/preorder units`,
      );
    }

    const unitPrice = Number(
      useB2BPrice ? row.b2b_price ?? 0 : row.retail_price ?? 0,
    );
    const vatRate = Number(row.vat_rate ?? 0.22);
    const stockQty = Math.min(item.quantity, availableStock);
    const preorderQty = Math.max(item.quantity - stockQty, 0);

    return {
      skuId: row.id,
      inventoryId: inventory.id,
      sku: row.sku,
      name: product?.name_it ?? row.sku,
      quantity: item.quantity,
      vatRate,
      totals: {
        unitPrice,
        subtotal: unitPrice * item.quantity,
        vat: unitPrice * item.quantity * vatRate,
      },
      stockSourceType: getStockSourceType(
        item.quantity,
        availableStock,
        incomingAvailable,
      ),
      stockQty,
      preorderQty,
      preorderLeadTimeMinDays:
        preorderQty > 0 ? Number(row.preorder_lead_time_min_days ?? 7) : null,
      preorderLeadTimeMaxDays:
        preorderQty > 0 ? Number(row.preorder_lead_time_max_days ?? 14) : null,
      stockReserved: Number(inventory.stock_reserved ?? 0),
      incomingReserved: Number(inventory.incoming_reserved ?? 0),
    };
  });
}

export async function reserveSupabaseInventory(
  supabase: SupabaseClient,
  orderId: string,
  lines: OrderLine[],
) {
  for (const line of lines) {
    const nextStockReserved = line.stockReserved + line.stockQty;
    const nextIncomingReserved = line.incomingReserved + line.preorderQty;

    const { data, error } = await supabase
      .from("inventory")
      .update({
        stock_reserved: nextStockReserved,
        incoming_reserved: nextIncomingReserved,
        updated_at: new Date().toISOString(),
      })
      .eq("id", line.inventoryId)
      .eq("stock_reserved", line.stockReserved)
      .eq("incoming_reserved", line.incomingReserved)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      throw new Error(`Inventory changed while reserving SKU ${line.sku}; please retry.`);
    }

    if (line.stockQty > 0) {
      await insertInventoryMovement(supabase, {
        skuId: line.skuId,
        orderId,
        movementType: "reserve_stock",
        quantity: line.stockQty,
        reservedDelta: line.stockQty,
        note: "Order stock reservation",
      });
    }

    if (line.preorderQty > 0) {
      await insertInventoryMovement(supabase, {
        skuId: line.skuId,
        orderId,
        movementType: "reserve_incoming",
        quantity: line.preorderQty,
        incomingReservedDelta: line.preorderQty,
        note: "Order preorder reservation",
      });
    }
  }
}

export async function createSupabaseOrderWithReservations({
  supabase,
  orderId,
  profileId,
  status,
  paymentStatus,
  reservationExpiresAt,
  reservedAt,
  paymentMethod,
  email,
  customerName,
  companyName,
  vatNumber,
  fiscalCode,
  sdi,
  pec,
  shippingAddress,
  currency = "EUR",
  metadata,
  lines,
}: {
  supabase: SupabaseClient;
  orderId: string;
  profileId: string;
  status: string;
  paymentStatus: string;
  reservationExpiresAt: string;
  reservedAt: string;
  paymentMethod: PaymentMethod;
  email?: string | null;
  customerName?: string | null;
  companyName?: string | null;
  vatNumber?: string | null;
  fiscalCode?: string | null;
  sdi?: string | null;
  pec?: string | null;
  shippingAddress?: string | null;
  currency?: string;
  metadata: Record<string, unknown>;
  lines: OrderLine[];
}) {
  const payload = {
    order_id: orderId,
    profile_id: profileId,
    status,
    payment_status: paymentStatus,
    reservation_expires_at: reservationExpiresAt,
    reserved_at: reservedAt,
    payment_method: paymentMethod,
    email,
    customer_name: customerName,
    company_name: companyName,
    vat_number: vatNumber,
    fiscal_code: fiscalCode,
    sdi,
    pec,
    shipping_address: shippingAddress,
    currency,
    metadata,
    lines: lines.map((line) => ({
      sku_id: line.skuId,
      inventory_id: line.inventoryId,
      sku: line.sku,
      name: line.name,
      quantity: line.quantity,
      unit_price: line.totals.unitPrice,
      vat_rate: line.vatRate,
      preorder_lead_time_min_days: line.preorderLeadTimeMinDays,
      preorder_lead_time_max_days: line.preorderLeadTimeMaxDays,
    })),
  };

  const { data, error } = await supabase.rpc("create_order_with_reservations", {
    payload,
  });

  if (error) throw new Error(error.message);
  return data as {
    order_id: string;
    order_number?: string;
    subtotal: number;
    vat: number;
    total: number;
    line_count: number;
    reservation_expires_at: string;
  };
}

export async function releaseOrderReservations({
  orderId,
  paymentStatus = "cancelled",
  status = "cancelled",
  note = "Order reservation released",
  actorProfileId,
}: {
  orderId: string;
  paymentStatus?: "cancelled" | "failed";
  status?: "cancelled";
  note?: string;
  actorProfileId?: string | null;
}) {
  if (!hasSupabaseAdminConfig()) {
    return { released: 0, demoMode: true };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("release_order_reservations", {
    p_order_id: orderId,
    p_payment_status: paymentStatus,
    p_order_status: status,
    p_note: note,
  });

  if (error) throw new Error(error.message);
  const result = {
    ...((data as Record<string, unknown> | null) ?? {}),
    released: Number((data as { released?: number } | null)?.released ?? 0),
    demoMode: false,
  };
  await tryRecordOrderEvent({
    supabase,
    orderId,
    eventType: "reservation_released",
    title: note,
    body: `Released ${Number((data as { released?: number } | null)?.released ?? 0)} reserved units.`,
    actorProfileId,
    metadata: {
      paymentStatus,
      status,
      result: data,
    },
  });
  return result;
}

export async function markOrderPaid({
  orderId,
  stripeCheckoutSessionId,
  stripePaymentIntentId,
  note,
  actorProfileId,
  locale,
}: {
  orderId: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string | null;
  note?: string;
  actorProfileId?: string | null;
  locale?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const order = await loadWorkflowOrder(supabase, orderId);
  const now = new Date().toISOString();
  const payload: Record<string, string> = {
    status: "paid",
    payment_status: "paid",
    paid_at: now,
    updated_at: now,
  };

  if (stripeCheckoutSessionId) {
    payload.stripe_checkout_session_id = stripeCheckoutSessionId;
  }

  if (stripePaymentIntentId) {
    payload.stripe_payment_intent_id = stripePaymentIntentId;
  }

  if (note) {
    payload.admin_note = note;
  }

  const { error } = await supabase.from("orders").update(payload).eq("id", orderId);
  if (error) throw new Error(error.message);

  await tryRecordOrderPaymentRecord({
    supabase,
    orderId,
    paymentMethod:
      order?.payment_method === "stripe" ||
      order?.payment_method === "cash" ||
      order?.payment_method === "bank_transfer"
        ? order.payment_method
        : stripeCheckoutSessionId
          ? "stripe"
          : "bank_transfer",
    paymentStatus: "paid",
    amount: Number(order?.total ?? 0),
    currency: order?.currency ?? "EUR",
    provider: stripeCheckoutSessionId ? "stripe" : order?.payment_method ?? null,
    providerReference: stripePaymentIntentId ?? stripeCheckoutSessionId,
    recordedBy: actorProfileId,
    note: note ?? "Payment marked paid",
    metadata: {
      stripeCheckoutSessionId: stripeCheckoutSessionId ?? null,
      stripePaymentIntentId: stripePaymentIntentId ?? null,
      source: stripeCheckoutSessionId ? "stripe_webhook" : "admin_manual",
    },
  });

  await tryRecordOrderEvent({
    supabase,
    orderId,
    eventType: "payment_paid",
    title: note ?? "Payment marked paid",
    body: `Payment confirmed for ${Number(order?.total ?? 0).toFixed(2)} ${order?.currency ?? "EUR"}.`,
    actorProfileId,
    metadata: {
      paymentMethod: order?.payment_method ?? null,
      stripeCheckoutSessionId: stripeCheckoutSessionId ?? null,
      stripePaymentIntentId: stripePaymentIntentId ?? null,
    },
  });

  await tryNotifyOrderCustomer({
    orderId,
    type: "payment_paid",
    locale,
    metadata: {
      stripeCheckoutSessionId: stripeCheckoutSessionId ?? null,
      stripePaymentIntentId: stripePaymentIntentId ?? null,
    },
  });
}

export async function issueOrderRefund({
  orderId,
  amount,
  reason = "requested_by_customer",
  note,
  providerReference,
  actorProfileId,
  locale,
}: {
  orderId: string;
  amount: number;
  reason?: RefundReason;
  note?: string | null;
  providerReference?: string | null;
  actorProfileId?: string | null;
  locale?: string | null;
}) {
  if (amount <= 0) {
    throw new Error("Refund amount must be greater than zero.");
  }

  const supabase = getSupabaseAdminClient();
  const order = await loadWorkflowOrder(supabase, orderId);
  if (!order) throw new Error("Order not found.");
  if (order.payment_status !== "paid" && order.payment_status !== "refunded") {
    throw new Error(`Order payment status is ${order.payment_status ?? "-"}, not paid.`);
  }

  const total = Number(order.total ?? 0);
  const currency = order.currency ?? "EUR";
  const activeRefundTotal = await getActiveRefundTotal(supabase, orderId);
  const remaining = Math.max(total - activeRefundTotal, 0);
  if (amount > remaining + 0.005) {
    throw new Error(
      `Refund exceeds remaining refundable amount ${remaining.toFixed(2)} ${currency}.`,
    );
  }

  const paymentMethod = normalizePaymentMethod(order.payment_method);
  const now = new Date().toISOString();
  let provider = "manual";
  let providerRefundId = providerReference?.trim() || null;
  let providerPaymentIntentId = order.stripe_payment_intent_id ?? null;
  let providerStatus: string | null = "manual_succeeded";
  let refundStatus: "pending" | "succeeded" | "failed" | "cancelled" = "succeeded";
  let providerMetadata: Record<string, unknown> = {};

  if (paymentMethod === "stripe") {
    if (!hasStripeConfig()) {
      throw new Error("STRIPE_SECRET_KEY is missing; cannot issue Stripe refund.");
    }

    provider = "stripe";
    providerPaymentIntentId =
      providerPaymentIntentId ||
      (await resolveStripePaymentIntent(order.stripe_checkout_session_id ?? null));

    if (!providerPaymentIntentId) {
      throw new Error("Stripe payment intent is missing for this order.");
    }

    const stripe = getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: providerPaymentIntentId,
      amount: Math.round(amount * 100),
      reason: toStripeRefundReason(reason),
      metadata: {
        orderId,
        reason,
      },
    });

    providerRefundId = refund.id;
    providerStatus = refund.status ?? null;
    refundStatus = mapStripeRefundStatus(refund.status);
    providerMetadata = {
      stripeRefundId: refund.id,
      stripeBalanceTransaction:
        typeof refund.balance_transaction === "string"
          ? refund.balance_transaction
          : refund.balance_transaction?.id ?? null,
      stripeCharge:
        typeof refund.charge === "string" ? refund.charge : refund.charge?.id ?? null,
    };

    if (providerPaymentIntentId !== order.stripe_payment_intent_id) {
      await supabase
        .from("orders")
        .update({
          stripe_payment_intent_id: providerPaymentIntentId,
          updated_at: now,
        })
        .eq("id", orderId);
    }
  }

  const paymentRecord = await recordOrderPaymentRecord({
    supabase,
    orderId,
    paymentMethod,
    paymentStatus: "refunded",
    amount,
    currency,
    provider,
    providerReference: providerRefundId,
    recordedBy: actorProfileId,
    note: note || "Refund recorded",
    metadata: {
      source: provider === "stripe" ? "stripe_refund_api" : "admin_manual_refund",
      reason,
      providerStatus,
      providerPaymentIntentId,
      ...providerMetadata,
    },
  });

  const { data: refundRow, error: refundError } = await supabase
    .from("order_refunds")
    .insert({
      order_id: orderId,
      payment_record_id: paymentRecord?.id ?? null,
      payment_method: paymentMethod,
      amount,
      currency,
      reason,
      note: note || null,
      provider,
      provider_refund_id: providerRefundId,
      provider_payment_intent_id: providerPaymentIntentId,
      provider_status: providerStatus,
      status: refundStatus,
      recorded_by: actorProfileId ?? null,
      metadata: {
        source: provider === "stripe" ? "stripe_refund_api" : "admin_manual_refund",
        providerReference: providerReference || null,
        ...providerMetadata,
      },
    })
    .select("id")
    .maybeSingle();

  if (refundError) throw new Error(refundError.message);

  const totals = await refreshOrderRefundTotals(supabase, orderId);

  await tryRecordOrderEvent({
    supabase,
    orderId,
    eventType: "refund_recorded",
    title: "Refund recorded",
    body: `${formatAmount(amount, currency)} refund ${refundStatus}.`,
    actorProfileId,
    metadata: {
      refundId: refundRow?.id ?? null,
      amount,
      currency,
      reason,
      provider,
      providerRefundId,
      providerStatus,
      refundStatus,
      totals,
    },
  });

  await tryNotifyOrderCustomer({
    orderId,
    type: "refund_recorded",
    locale,
    metadata: {
      refundId: refundRow?.id ?? null,
      refundAmount: amount,
      currency,
      reason,
      provider,
      refundStatus,
    },
  });

  return {
    refundId: refundRow?.id ?? null,
    amount,
    currency,
    provider,
    providerRefundId,
    providerPaymentIntentId,
    status: refundStatus,
    totals,
  };
}

export async function syncStripeRefundStatus({
  stripeRefundId,
  stripePaymentIntentId,
  stripeStatus,
  failureReason,
}: {
  stripeRefundId: string;
  stripePaymentIntentId?: string | null;
  stripeStatus?: string | null;
  failureReason?: string | null;
}) {
  if (!hasSupabaseAdminConfig()) return { updated: false, demoMode: true };

  const supabase = getSupabaseAdminClient();
  const { data: refund, error } = await supabase
    .from("order_refunds")
    .select("id, order_id, status, metadata")
    .eq("provider_refund_id", stripeRefundId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!refund) return { updated: false, demoMode: false };

  const nextStatus = mapStripeRefundStatus(stripeStatus);
  const metadata =
    refund.metadata && typeof refund.metadata === "object"
      ? (refund.metadata as Record<string, unknown>)
      : {};

  const { error: updateError } = await supabase
    .from("order_refunds")
    .update({
      status: nextStatus,
      provider_status: stripeStatus ?? null,
      provider_payment_intent_id: stripePaymentIntentId ?? null,
      metadata: {
        ...metadata,
        stripeStatus,
        failureReason: failureReason ?? null,
        source: "stripe_webhook",
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", refund.id);

  if (updateError) throw new Error(updateError.message);

  const totals = await refreshOrderRefundTotals(supabase, refund.order_id);
  await tryRecordOrderEvent({
    supabase,
    orderId: refund.order_id,
    eventType: "refund_status_updated",
    title: "Stripe refund status updated",
    body: `Stripe refund ${stripeRefundId} is ${stripeStatus ?? nextStatus}.`,
    metadata: {
      stripeRefundId,
      stripePaymentIntentId: stripePaymentIntentId ?? null,
      stripeStatus: stripeStatus ?? null,
      failureReason: failureReason ?? null,
      totals,
    },
  });

  return { updated: true, status: nextStatus, totals, demoMode: false };
}

export async function confirmManualPayment({
  orderId,
  expectedMethod,
  actorProfileId,
  locale,
}: {
  orderId: string;
  expectedMethod: "cash" | "bank_transfer";
  actorProfileId?: string | null;
  locale?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const order = await loadWorkflowOrder(supabase, orderId);
  if (!order) throw new Error("Order not found.");
  if (order.payment_method !== expectedMethod) {
    throw new Error(`Order payment method is ${order.payment_method}, not ${expectedMethod}.`);
  }
  await markOrderPaid({
    orderId,
    actorProfileId,
    locale,
    note:
      expectedMethod === "cash"
        ? "Cash payment confirmed by admin"
        : "Bank transfer confirmed by admin",
  });
}

export async function addOrderPaymentProof({
  orderId,
  paymentMethod,
  paymentStatus,
  amount,
  providerReference,
  proofUrl,
  proofLabel,
  note,
  actorProfileId,
  locale,
}: {
  orderId: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  amount: number;
  providerReference?: string | null;
  proofUrl?: string | null;
  proofLabel?: string | null;
  note?: string | null;
  actorProfileId?: string | null;
  locale?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const order = await loadWorkflowOrder(supabase, orderId);
  if (!order) throw new Error("Order not found.");

  await recordOrderPaymentRecord({
    supabase,
    orderId,
    paymentMethod,
    paymentStatus,
    amount,
    currency: order.currency ?? "EUR",
    provider: paymentMethod === "stripe" ? "stripe" : "manual",
    providerReference: providerReference || null,
    proofUrl: proofUrl || null,
    proofLabel: proofLabel || null,
    recordedBy: actorProfileId,
    note: note || "Payment proof recorded",
    metadata: {
      source: "admin_payment_proof",
      proofUrl: proofUrl || null,
      proofLabel: proofLabel || null,
    },
  });

  await tryRecordOrderEvent({
    supabase,
    orderId,
    eventType: "payment_proof_added",
    title: "Payment proof added",
    body: note || proofLabel || "Admin added a payment proof/reference.",
    actorProfileId,
    metadata: {
      paymentMethod,
      paymentStatus,
      amount,
      providerReference: providerReference || null,
      proofUrl: proofUrl || null,
      proofLabel: proofLabel || null,
    },
  });

  await tryNotifyOrderCustomer({
    orderId,
    type: "payment_proof_added",
    locale,
    metadata: {
      paymentMethod,
      paymentStatus,
      amount,
      providerReference: providerReference || null,
      proofUrl: proofUrl || null,
      proofLabel: proofLabel || null,
    },
  });

  return {
    paymentMethod,
    paymentStatus,
    amount,
    providerReference: providerReference || null,
    proofUrl: proofUrl || null,
    proofLabel: proofLabel || null,
  };
}

export async function updateOrderShipment({
  orderId,
  shippingCarrier,
  trackingNumber,
  trackingUrl,
  shipmentNote,
  customerNote,
  actorProfileId,
  locale,
}: {
  orderId: string;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shipmentNote?: string | null;
  customerNote?: string | null;
  actorProfileId?: string | null;
  locale?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const shipmentPayload: Record<string, string | null> = {
    shipping_carrier: shippingCarrier || null,
    tracking_number: trackingNumber || null,
    tracking_url: trackingUrl || null,
    shipment_note: shipmentNote || null,
    customer_note: customerNote || null,
    shipped_at: trackingNumber || trackingUrl ? now : null,
    updated_at: now,
  };
  if (trackingNumber || trackingUrl) shipmentPayload.status = "shipped";
  const { error } = await supabase
    .from("orders")
    .update(shipmentPayload)
    .eq("id", orderId);
  if (error) throw new Error(error.message);

  await tryRecordOrderEvent({
    supabase,
    orderId,
    eventType: "shipment_updated",
    title: "Shipment information updated",
    body:
      customerNote ||
      shipmentNote ||
      [shippingCarrier, trackingNumber].filter(Boolean).join(" / ") ||
      "Admin updated shipment information.",
    actorProfileId,
    metadata: {
      shippingCarrier: shippingCarrier || null,
      trackingNumber: trackingNumber || null,
      trackingUrl: trackingUrl || null,
      shipmentNote: shipmentNote || null,
      customerNote: customerNote || null,
      shippedAt: shipmentPayload.shipped_at,
    },
  });

  await tryNotifyOrderCustomer({
    orderId,
    type: "shipment_updated",
    locale,
    metadata: {
      shippingCarrier: shippingCarrier || null,
      trackingNumber: trackingNumber || null,
      trackingUrl: trackingUrl || null,
    },
  });

  return shipmentPayload;
}

export async function extendOrderReservation(
  orderId: string,
  actorProfileId?: string | null,
) {
  const supabase = getSupabaseAdminClient();
  const expiresAt = getReservationExpiry().toISOString();
  const { error } = await supabase
    .from("orders")
    .update({
      reservation_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
      admin_note: "Reservation extended 24 hours",
    })
    .eq("id", orderId)
    .is("released_at", null);

  if (error) throw new Error(error.message);
  await tryRecordOrderEvent({
    supabase,
    orderId,
    eventType: "reservation_extended",
    title: "Reservation extended",
    body: `Reservation extended until ${expiresAt}.`,
    actorProfileId,
    metadata: {
      reservationExpiresAt: expiresAt,
    },
  });
  return { reservationExpiresAt: expiresAt };
}

export async function releaseExpiredReservations() {
  if (!hasSupabaseAdminConfig()) {
    return { processed: 0, released: 0, demoMode: true };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .in("payment_status", ["pending_card", "pending_cash", "pending_bank_transfer"])
    .is("released_at", null)
    .lt("reservation_expires_at", new Date().toISOString())
    .limit(100);

  if (error) throw new Error(error.message);

  let released = 0;
  for (const order of data ?? []) {
    const result = await releaseOrderReservations({
      orderId: order.id,
      paymentStatus: "cancelled",
      status: "cancelled",
      note: "Reservation expired after 24 hours",
    });
    released += result.released;
  }

  return { processed: data?.length ?? 0, released, demoMode: false };
}

export async function recordOrderEvent({
  supabase,
  orderId,
  eventType,
  title,
  body,
  actorProfileId,
  metadata = {},
}: {
  supabase?: SupabaseClient;
  orderId: string;
  eventType: string;
  title: string;
  body?: string | null;
  actorProfileId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!hasSupabaseAdminConfig()) return;
  const client = supabase ?? getSupabaseAdminClient();
  const { error } = await client.from("order_timeline_events").insert({
    order_id: orderId,
    event_type: eventType,
    title,
    body: body ?? null,
    actor_profile_id: actorProfileId ?? null,
    customer_visible: true,
    metadata,
  });
  if (error) throw new Error(error.message);
}

export async function recordOrderPaymentRecord({
  supabase,
  orderId,
  paymentMethod,
  paymentStatus,
  amount,
  currency = "EUR",
  provider,
  providerReference,
  proofUrl,
  proofLabel,
  recordedBy,
  note,
  metadata = {},
}: {
  supabase?: SupabaseClient;
  orderId: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  amount: number;
  currency?: string | null;
  provider?: string | null;
  providerReference?: string | null;
  proofUrl?: string | null;
  proofLabel?: string | null;
  recordedBy?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!hasSupabaseAdminConfig()) return;
  const client = supabase ?? getSupabaseAdminClient();
  const { data, error } = await client
    .from("order_payment_records")
    .insert({
      order_id: orderId,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      amount,
      currency: currency ?? "EUR",
      provider: provider ?? null,
      provider_reference: providerReference ?? null,
      proof_url: proofUrl ?? null,
      proof_label: proofLabel ?? null,
      recorded_by: recordedBy ?? null,
      note: note ?? null,
      metadata,
    })
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as { id: string } | null;
}

async function tryRecordOrderEvent(
  payload: Parameters<typeof recordOrderEvent>[0],
) {
  try {
    await recordOrderEvent(payload);
  } catch (error) {
    console.error("Failed to record order event", error);
  }
}

async function tryRecordOrderPaymentRecord(
  payload: Parameters<typeof recordOrderPaymentRecord>[0],
) {
  try {
    await recordOrderPaymentRecord(payload);
  } catch (error) {
    console.error("Failed to record order payment record", error);
  }
}

async function tryNotifyOrderCustomer(
  payload: Parameters<typeof notifyOrderCustomer>[0],
) {
  try {
    await notifyOrderCustomer(payload);
  } catch (error) {
    console.error("Failed to notify order customer", error);
  }
}

async function loadWorkflowOrder(supabase: SupabaseClient, orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, payment_method, payment_status, total, currency, stripe_checkout_session_id, stripe_payment_intent_id, refund_total, released_at, order_items ( id, sku, quantity )",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as WorkflowOrder | null;
}

async function getActiveRefundTotal(supabase: SupabaseClient, orderId: string) {
  const { data, error } = await supabase
    .from("order_refunds")
    .select("amount, status")
    .eq("order_id", orderId)
    .in("status", ["pending", "succeeded"]);

  if (error) throw new Error(error.message);

  return (data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
}

async function refreshOrderRefundTotals(supabase: SupabaseClient, orderId: string) {
  const [{ data: refunds, error: refundError }, { data: order, error: orderError }] =
    await Promise.all([
      supabase
        .from("order_refunds")
        .select("amount, status")
        .eq("order_id", orderId)
        .eq("status", "succeeded"),
      supabase
        .from("orders")
        .select("total, payment_status, status")
        .eq("id", orderId)
        .maybeSingle(),
    ]);

  if (refundError) throw new Error(refundError.message);
  if (orderError) throw new Error(orderError.message);
  if (!order) throw new Error("Order not found.");

  const refundTotal = (refunds ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );
  const total = Number(order.total ?? 0);
  const isFullyRefunded = total > 0 && refundTotal >= total - 0.005;
  const payload: Record<string, string | number | null> = {
    refund_total: roundMoney(refundTotal),
    refunded_at: refundTotal > 0 ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  if (isFullyRefunded) {
    payload.payment_status = "refunded";
    payload.status = "refunded";
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", orderId);

  if (updateError) throw new Error(updateError.message);

  return {
    refundTotal: roundMoney(refundTotal),
    refundableRemaining: roundMoney(Math.max(total - refundTotal, 0)),
    isFullyRefunded,
  };
}

async function resolveStripePaymentIntent(stripeCheckoutSessionId: string | null) {
  if (!stripeCheckoutSessionId) return null;
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(stripeCheckoutSessionId);
  const paymentIntent = session.payment_intent;
  if (!paymentIntent) return null;
  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

function normalizePaymentMethod(value: string): PaymentMethod {
  if (value === "stripe" || value === "cash" || value === "bank_transfer") {
    return value;
  }
  return "bank_transfer";
}

function toStripeRefundReason(reason: RefundReason) {
  if (
    reason === "duplicate" ||
    reason === "fraudulent" ||
    reason === "requested_by_customer"
  ) {
    return reason;
  }
  return "requested_by_customer";
}

function mapStripeRefundStatus(status: string | null | undefined) {
  if (status === "succeeded") return "succeeded";
  if (status === "failed") return "failed";
  if (status === "canceled" || status === "cancelled") return "cancelled";
  return "pending";
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function formatAmount(amount: number, currency: string) {
  return `${amount.toFixed(2)} ${currency}`;
}

async function insertInventoryMovement(
  supabase: SupabaseClient,
  payload: {
    skuId: string;
    orderId: string;
    movementType:
      | "reserve_stock"
      | "reserve_incoming"
      | "release_reservation"
      | "allocate_preorder"
      | "ship_stock";
    quantity: number;
    stockDelta?: number;
    reservedDelta?: number;
    incomingReservedDelta?: number;
    note: string;
  },
) {
  const { error } = await supabase.from("inventory_movements").insert({
    sku_id: payload.skuId,
    order_id: payload.orderId,
    movement_type: payload.movementType,
    quantity: payload.quantity,
    stock_delta: payload.stockDelta ?? 0,
    reserved_delta: payload.reservedDelta ?? 0,
    incoming_reserved_delta: payload.incomingReservedDelta ?? 0,
    note: payload.note,
  });

  if (error) throw new Error(error.message);
}
