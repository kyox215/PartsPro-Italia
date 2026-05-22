export const adminOrderV2RpcNames = {
  addPaymentProof: "admin_v2_add_payment_proof",
  appendTimeline: "admin_v2_append_order_timeline",
  confirmPayment: "admin_v2_confirm_payment",
  createOrder: "admin_v2_create_order",
  issueRefund: "admin_v2_refund_order",
  releaseExpiredInventory: "admin_v2_release_expired_inventory",
  releaseInventory: "admin_v2_release_inventory",
  syncStripeRefund: "admin_v2_sync_stripe_refund_status",
  updateShipment: "admin_v2_ship_order",
  updateStatus: "admin_v2_update_order_status",
  updateStripeCheckout: "admin_v2_update_stripe_checkout",
} as const;

export type AdminOrderV2RpcName =
  (typeof adminOrderV2RpcNames)[keyof typeof adminOrderV2RpcNames];

export type AdminOrderV2Error = {
  code: string;
  details?: Record<string, unknown>;
  message: string;
};

export type AdminOrderV2RpcResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: AdminOrderV2Error };

export type AdminOrderV2PaymentMethod = "stripe" | "cash" | "bank_transfer";
export type AdminOrderV2PaymentStatus =
  | "pending_card"
  | "pending_cash"
  | "pending_bank_transfer"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";
export type AdminOrderV2OrderStatus =
  | "checkout_created"
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded";
export type AdminOrderV2RefundReason =
  | "duplicate"
  | "fraudulent"
  | "requested_by_customer"
  | "order_cancelled"
  | "other";

export type AdminOrderV2LinePayload = {
  inventory_id: string;
  name: string;
  preorder_lead_time_max_days?: number | null;
  preorder_lead_time_min_days?: number | null;
  quantity: number;
  sku: string;
  sku_id: string;
  unit_price: number;
  vat_rate: number;
};

export type AdminOrderV2CreateOrderPayload = {
  company_name?: string | null;
  currency: string;
  customer_name?: string | null;
  email?: string | null;
  fiscal_code?: string | null;
  lines: AdminOrderV2LinePayload[];
  metadata: Record<string, unknown>;
  order_id: string;
  payment_method: AdminOrderV2PaymentMethod;
  payment_status: AdminOrderV2PaymentStatus;
  pec?: string | null;
  profile_id: string;
  reservation_expires_at: string;
  reserved_at: string;
  sdi?: string | null;
  shipping_address?: string | null;
  status: AdminOrderV2OrderStatus;
  vat_number?: string | null;
};

export type AdminOrderV2CreateOrderData = {
  line_count: number;
  order_id: string;
  order_number?: string;
  reservation_expires_at: string;
  subtotal: number;
  total: number;
  vat: number;
};

export type AdminOrderV2ReleaseInventoryPayload = {
  actor_profile_id?: string | null;
  note?: string | null;
  order_id: string;
  payment_status: "cancelled" | "failed";
  status: "cancelled";
};

export type AdminOrderV2ReleaseInventoryData = {
  released: number;
  skipped?: boolean;
  reason?: string;
};

export type AdminOrderV2ConfirmPaymentPayload = {
  actor_profile_id?: string | null;
  expected_method: "cash" | "bank_transfer" | "stripe";
  locale?: "it" | "zh" | null;
  note?: string | null;
  order_id: string;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
};

export type AdminOrderV2PaymentProofPayload = {
  amount: number;
  currency?: string | null;
  note?: string | null;
  order_id: string;
  payment_method: AdminOrderV2PaymentMethod;
  payment_status: AdminOrderV2PaymentStatus;
  proof_label?: string | null;
  proof_url?: string | null;
  provider?: string | null;
  provider_reference?: string | null;
  recorded_by?: string | null;
  timeline_body?: string | null;
};

export type AdminOrderV2ShipmentPayload = {
  actor_profile_id?: string | null;
  customer_note?: string | null;
  locale?: "it" | "zh" | null;
  order_id: string;
  shipment_note?: string | null;
  shipping_carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
};

export type AdminOrderV2RefundPayload = {
  actor_profile_id?: string | null;
  amount: number;
  locale?: "it" | "zh" | null;
  note?: string | null;
  order_id: string;
  provider?: "manual" | "stripe" | string | null;
  provider_payment_intent_id?: string | null;
  provider_reference?: string | null;
  provider_status?: string | null;
  reason: AdminOrderV2RefundReason;
  status?: "pending" | "succeeded" | "failed" | "cancelled";
};

export type AdminOrderV2StatusPayload = {
  actor_profile_id?: string | null;
  order_id: string;
  status: AdminOrderV2OrderStatus;
};

export type AdminOrderV2StripeCheckoutPayload = {
  order_id: string;
  stripe_checkout_session_id: string;
  stripe_payment_intent_id?: string | null;
};

export type AdminOrderV2TimelinePayload = {
  actor_profile_id?: string | null;
  body?: string | null;
  customer_visible?: boolean;
  event_type: string;
  metadata?: Record<string, unknown>;
  order_id: string;
  title: string;
};

export type AdminOrderV2StripeRefundSyncPayload = {
  failure_reason?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_refund_id: string;
  stripe_status?: string | null;
};

export type AdminOrderV2GenericData = Record<string, unknown>;

export function toAdminOrderV2Response<T>(
  value: unknown,
): AdminOrderV2RpcResponse<T> {
  if (isAdminOrderV2Response<T>(value)) return value;

  return {
    ok: true,
    data: value as T,
  };
}

export function assertAdminOrderV2Ok<T>(
  response: AdminOrderV2RpcResponse<T>,
): T {
  if (response.ok) return response.data;

  const error = new Error(response.error.message);
  error.name = response.error.code;
  throw error;
}

export function buildAdminOrderV2CreatePayload(input: {
  companyName?: string | null;
  currency?: string;
  customerName?: string | null;
  email?: string | null;
  fiscalCode?: string | null;
  lines: Array<{
    inventoryId: string;
    name: string;
    preorderLeadTimeMaxDays?: number | null;
    preorderLeadTimeMinDays?: number | null;
    quantity: number;
    sku: string;
    skuId: string;
    totals: {
      unitPrice: number;
    };
    vatRate: number;
  }>;
  metadata: Record<string, unknown>;
  orderId: string;
  paymentMethod: string;
  paymentStatus: string;
  pec?: string | null;
  profileId: string;
  reservationExpiresAt: string;
  reservedAt: string;
  sdi?: string | null;
  shippingAddress?: string | null;
  status: string;
  vatNumber?: string | null;
}): AdminOrderV2CreateOrderPayload {
  return {
    company_name: input.companyName ?? null,
    currency: input.currency ?? "EUR",
    customer_name: input.customerName ?? null,
    email: input.email ?? null,
    fiscal_code: input.fiscalCode ?? null,
    lines: input.lines.map((line) => ({
      inventory_id: line.inventoryId,
      name: line.name,
      preorder_lead_time_max_days: line.preorderLeadTimeMaxDays ?? null,
      preorder_lead_time_min_days: line.preorderLeadTimeMinDays ?? null,
      quantity: line.quantity,
      sku: line.sku,
      sku_id: line.skuId,
      unit_price: line.totals.unitPrice,
      vat_rate: line.vatRate,
    })),
    metadata: input.metadata,
    order_id: input.orderId,
    payment_method: normalizeAdminOrderV2PaymentMethod(input.paymentMethod),
    payment_status: normalizeAdminOrderV2PaymentStatus(input.paymentStatus),
    pec: input.pec ?? null,
    profile_id: input.profileId,
    reservation_expires_at: input.reservationExpiresAt,
    reserved_at: input.reservedAt,
    sdi: input.sdi ?? null,
    shipping_address: input.shippingAddress ?? null,
    status: normalizeAdminOrderV2OrderStatus(input.status),
    vat_number: input.vatNumber ?? null,
  };
}

function normalizeAdminOrderV2PaymentMethod(value: string): AdminOrderV2PaymentMethod {
  if (value === "stripe" || value === "cash" || value === "bank_transfer") return value;
  return "bank_transfer";
}

function normalizeAdminOrderV2PaymentStatus(value: string): AdminOrderV2PaymentStatus {
  if (
    value === "pending_card" ||
    value === "pending_cash" ||
    value === "pending_bank_transfer" ||
    value === "paid" ||
    value === "failed" ||
    value === "cancelled" ||
    value === "refunded"
  ) {
    return value;
  }

  return "pending_bank_transfer";
}

function normalizeAdminOrderV2OrderStatus(value: string): AdminOrderV2OrderStatus {
  if (
    value === "checkout_created" ||
    value === "pending_payment" ||
    value === "paid" ||
    value === "processing" ||
    value === "shipped" ||
    value === "completed" ||
    value === "cancelled" ||
    value === "refunded"
  ) {
    return value;
  }

  return "pending_payment";
}

function isAdminOrderV2Response<T>(
  value: unknown,
): value is AdminOrderV2RpcResponse<T> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { ok?: unknown };
  return candidate.ok === true || candidate.ok === false;
}
