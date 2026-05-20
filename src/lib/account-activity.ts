import { toAttachmentHref } from "@/lib/admin-attachment-storage";
import type { AuthContext } from "@/lib/auth";
import { products } from "@/lib/catalog";
import {
  getSupabaseServerClient,
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";

export type AccountOrderRow = {
  id: string;
  status: string;
  paymentStatus?: string | null;
  fulfillmentStatus?: string | null;
  paymentMethod: string;
  total: number;
  refundTotal?: number;
  currency: string;
  reservationExpiresAt?: string | null;
  paidAt?: string | null;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shipmentNote?: string | null;
  shippedAt?: string | null;
  customerNote?: string | null;
  createdAt: string;
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    fulfillmentType?: string;
    stockQty?: number;
    preorderQty?: number;
    preorderLeadTimeMinDays?: number | null;
    preorderLeadTimeMaxDays?: number | null;
  }>;
  paymentRecords: Array<{
    id: string;
    paymentMethod: string;
    paymentStatus: string;
    amount: number;
    currency: string;
    provider?: string | null;
    providerReference?: string | null;
    proofUrl?: string | null;
    proofLabel?: string | null;
    note?: string | null;
    createdAt: string;
  }>;
  refunds: Array<{
    id: string;
    paymentMethod: string;
    amount: number;
    currency: string;
    reason: string;
    status: string;
    provider?: string | null;
    providerRefundId?: string | null;
    note?: string | null;
    createdAt: string;
  }>;
  timelineEvents: Array<{
    id: string;
    eventType: string;
    title: string;
    body?: string | null;
    createdAt: string;
  }>;
};

export type AccountRmaRow = {
  id: string;
  rmaNumber?: string | null;
  orderId?: string | null;
  status: string;
  orderNumber: string;
  sku: string;
  quantity: number;
  issueType: string;
  description: string | null;
  resolutionType?: string | null;
  resolutionNote?: string | null;
  refundAmount?: number | null;
  replacementSku?: string | null;
  closedAt?: string | null;
  attachments: Array<{
    id: string;
    label: string;
    url: string;
    note?: string | null;
    createdAt: string;
  }>;
  createdAt: string;
  events: Array<{
    id: string;
    eventType: string;
    title: string;
    body?: string | null;
    createdAt: string;
  }>;
};

export type AccountNotificationRow = {
  id: string;
  channel: string;
  subject: string;
  body: string;
  status: string;
  orderId?: string | null;
  rmaId?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export type AccountActivity = {
  orders: AccountOrderRow[];
  rmas: AccountRmaRow[];
  notifications: AccountNotificationRow[];
  generatedAt: string;
  orderCount: number;
  openRmaCount: number;
  totalSpend: number;
  unreadNotificationCount: number;
};

export async function getAccountActivity(
  auth: AuthContext,
): Promise<AccountActivity> {
  if (!auth.configured) {
    return summarizeActivity({
      orders: [
        {
          id: "demo-order-1001",
          status: "pending_payment",
          paymentStatus: "pending_bank_transfer",
          fulfillmentStatus: "awaiting_preorder",
          paymentMethod: "bank_transfer",
          total: 519.24,
          refundTotal: 0,
          currency: "EUR",
          reservationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          paidAt: null,
          shippingCarrier: "DHL",
          trackingNumber: "DEMO123456",
          trackingUrl: "https://www.dhl.com/",
          shipmentNote: "Demo shipment reference.",
          shippedAt: null,
          customerNote: "Demo: shipment details appear here after dispatch.",
          createdAt: new Date().toISOString(),
          items: [
            {
              sku: products[0].sku,
              name: products[0].names.it,
              quantity: 5,
              unitPrice: products[0].b2bPrice,
              fulfillmentType: "stock",
              stockQty: 5,
              preorderQty: 0,
            },
            {
              sku: products[1].sku,
              name: products[1].names.it,
              quantity: 10,
              unitPrice: products[1].b2bPrice,
              fulfillmentType: "preorder",
              stockQty: 0,
              preorderQty: 10,
              preorderLeadTimeMinDays: 7,
              preorderLeadTimeMaxDays: 14,
            },
          ],
          paymentRecords: [],
          refunds: [],
          timelineEvents: [
            {
              id: "demo-order-event-1",
              eventType: "order_created",
              title: "Demo order created",
              body: "Order updates will appear here.",
              createdAt: new Date().toISOString(),
            },
          ],
        },
      ],
      rmas: [
        {
          id: "demo-rma-1",
          rmaNumber: "RMA-DEMO-001",
          orderId: "demo-order-1001",
          status: "submitted",
          orderNumber: "demo-order-1001",
          sku: products[0].sku,
          quantity: 1,
          issueType: "touch_issue",
          description: "Touch intermittente prima dell'installazione.",
          resolutionType: null,
          resolutionNote: null,
          refundAmount: null,
          replacementSku: null,
          closedAt: null,
          attachments: [],
          createdAt: new Date().toISOString(),
          events: [
            {
              id: "demo-rma-event-1",
              eventType: "rma_submitted",
              title: "Demo RMA submitted",
              body: "The after-sales team will update this timeline.",
              createdAt: new Date().toISOString(),
            },
          ],
        },
      ],
      notifications: [
        {
          id: "demo-notification-1",
          channel: "email",
          subject: "PartsPro demo notification",
          body: "Order and RMA updates will also appear in this workspace.",
          status: "skipped",
          orderId: "demo-order-1001",
          rmaId: null,
          readAt: null,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }

  if (!auth.user || !hasSupabasePublicConfig()) {
    return summarizeActivity({ orders: [], rmas: [] });
  }

  const supabase = await getSupabaseServerClient();
  const [ordersResult, rmasResult, notificationsResult] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, status, payment_status, fulfillment_status, payment_method, total, refund_total, currency, reservation_expires_at, paid_at, created_at, order_items (*)",
      )
      .eq("profile_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("rmas")
      .select(
        "id, rma_number, order_id, status, order_number, sku, quantity, issue_type, description, resolution_type, resolution_note, refund_amount, replacement_sku, closed_at, attachments, created_at",
      )
      .eq("profile_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("notification_events")
      .select("id, channel, subject, body, status, order_id, rma_id, read_at, created_at")
      .eq("profile_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (ordersResult.error) {
    console.error("Failed to load account orders", ordersResult.error);
  }

  if (rmasResult.error) {
    console.error("Failed to load account RMAs", rmasResult.error);
  }

  if (notificationsResult.error) {
    console.error("Failed to load account notifications", notificationsResult.error);
  }

  return summarizeActivity({
    orders: (ordersResult.data ?? []).map(mapAccountOrder),
    rmas: (rmasResult.data ?? []).map(mapAccountRma),
    notifications: (notificationsResult.data ?? []).map(mapAccountNotification),
  });
}

export async function getAccountOrderById(
  auth: AuthContext,
  orderId: string,
): Promise<AccountOrderRow | null> {
  if (!auth.configured) {
    const activity = await getAccountActivity(auth);
    return activity.orders.find((order) => order.id === orderId) ?? null;
  }

  if (!auth.user || !hasSupabasePublicConfig()) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, payment_status, fulfillment_status, payment_method, total, refund_total, currency, reservation_expires_at, paid_at, shipping_carrier, tracking_number, tracking_url, shipment_note, shipped_at, customer_note, created_at, order_items (*), order_payment_records (*), order_refunds (*), order_timeline_events (*)")
    .eq("profile_id", auth.user.id)
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load account order detail", error);
    return null;
  }

  return data ? mapAccountOrder(data) : null;
}

export async function getAccountRmaById(
  auth: AuthContext,
  rmaId: string,
): Promise<AccountRmaRow | null> {
  if (!auth.configured) {
    const activity = await getAccountActivity(auth);
    return activity.rmas.find((rma) => rma.id === rmaId) ?? null;
  }

  if (!auth.user || !hasSupabasePublicConfig()) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("rmas")
    .select(
      "id, rma_number, order_id, status, order_number, sku, quantity, issue_type, description, resolution_type, resolution_note, refund_amount, replacement_sku, closed_at, attachments, created_at, rma_events (*)",
    )
    .eq("profile_id", auth.user.id)
    .eq("id", rmaId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load account RMA detail", error);
    return null;
  }

  return data ? mapAccountRma(data) : null;
}

function mapAccountOrder(order: {
  id: string;
  status: string;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  payment_method: string;
  total: number | string | null;
  refund_total?: number | string | null;
  currency: string | null;
  reservation_expires_at?: string | null;
  paid_at?: string | null;
  shipping_carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  shipment_note?: string | null;
  shipped_at?: string | null;
  customer_note?: string | null;
  created_at: string;
  order_items?: Array<{
    sku: string;
    name: string;
    quantity: number;
    unit_price: number | string;
    fulfillment_type?: string | null;
    stock_qty?: number | null;
    preorder_qty?: number | null;
    preorder_lead_time_min_days?: number | null;
    preorder_lead_time_max_days?: number | null;
  }> | null;
  order_payment_records?: Array<{
    id: string;
    payment_method: string;
    payment_status: string;
    amount: number | string;
    currency: string | null;
    provider?: string | null;
    provider_reference?: string | null;
    proof_url?: string | null;
    proof_label?: string | null;
    note?: string | null;
    created_at: string;
  }> | null;
  order_refunds?: Array<{
    id: string;
    payment_method: string;
    amount: number | string;
    currency: string | null;
    reason: string;
    status: string;
    provider?: string | null;
    provider_refund_id?: string | null;
    note?: string | null;
    created_at: string;
  }> | null;
  order_timeline_events?: Array<{
    id: string;
    event_type: string;
    title: string;
    body?: string | null;
    customer_visible?: boolean | null;
    created_at: string;
  }> | null;
}): AccountOrderRow {
  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.payment_status ?? null,
    fulfillmentStatus: order.fulfillment_status ?? null,
    paymentMethod: order.payment_method,
    total: Number(order.total ?? 0),
    refundTotal: Number(order.refund_total ?? 0),
    currency: order.currency ?? "EUR",
    reservationExpiresAt: order.reservation_expires_at ?? null,
    paidAt: order.paid_at ?? null,
    shippingCarrier: order.shipping_carrier ?? null,
    trackingNumber: order.tracking_number ?? null,
    trackingUrl: order.tracking_url ?? null,
    shipmentNote: order.shipment_note ?? null,
    shippedAt: order.shipped_at ?? null,
    customerNote: order.customer_note ?? null,
    createdAt: order.created_at,
    items: (order.order_items ?? []).map((item) => ({
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price ?? 0),
      fulfillmentType: item.fulfillment_type ?? undefined,
      stockQty: item.stock_qty ?? undefined,
      preorderQty: item.preorder_qty ?? undefined,
      preorderLeadTimeMinDays: item.preorder_lead_time_min_days ?? null,
      preorderLeadTimeMaxDays: item.preorder_lead_time_max_days ?? null,
    })),
    paymentRecords: (order.order_payment_records ?? [])
      .map((record) => ({
        id: record.id,
        paymentMethod: record.payment_method,
        paymentStatus: record.payment_status,
        amount: Number(record.amount ?? 0),
        currency: record.currency ?? "EUR",
        provider: record.provider ?? null,
        providerReference: record.provider_reference ?? null,
        proofUrl: toAttachmentHref(record.proof_url),
        proofLabel: record.proof_label ?? null,
        note: record.note ?? null,
        createdAt: record.created_at,
      }))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    refunds: (order.order_refunds ?? [])
      .map((refund) => ({
        id: refund.id,
        paymentMethod: refund.payment_method,
        amount: Number(refund.amount ?? 0),
        currency: refund.currency ?? "EUR",
        reason: refund.reason,
        status: refund.status,
        provider: refund.provider ?? null,
        providerRefundId: refund.provider_refund_id ?? null,
        note: refund.note ?? null,
        createdAt: refund.created_at,
      }))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    timelineEvents: (order.order_timeline_events ?? [])
      .filter((event) => event.customer_visible ?? true)
      .map((event) => ({
        id: event.id,
        eventType: event.event_type,
        title: event.title,
        body: event.body ?? null,
        createdAt: event.created_at,
      }))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  };
}

function mapAccountRma(rma: {
  id: string;
  rma_number?: string | null;
  order_id?: string | null;
  status: string;
  order_number: string;
  sku: string;
  quantity: number;
  issue_type: string;
  description: string | null;
  resolution_type?: string | null;
  resolution_note?: string | null;
  refund_amount?: number | string | null;
  replacement_sku?: string | null;
  closed_at?: string | null;
  attachments?: unknown;
  created_at: string;
  rma_events?: Array<{
    id: string;
    event_type: string;
    title: string;
    body?: string | null;
    customer_visible?: boolean | null;
    created_at: string;
  }> | null;
}): AccountRmaRow {
  return {
    id: rma.id,
    rmaNumber: rma.rma_number ?? null,
    orderId: rma.order_id ?? null,
    status: rma.status,
    orderNumber: rma.order_number,
    sku: rma.sku,
    quantity: rma.quantity,
    issueType: rma.issue_type,
    description: rma.description,
    resolutionType: rma.resolution_type ?? null,
    resolutionNote: rma.resolution_note ?? null,
    refundAmount:
      rma.refund_amount === null || rma.refund_amount === undefined
        ? null
        : Number(rma.refund_amount),
    replacementSku: rma.replacement_sku ?? null,
    closedAt: rma.closed_at ?? null,
    attachments: normalizeRmaAttachments(rma.attachments),
    createdAt: rma.created_at,
    events: (rma.rma_events ?? [])
      .filter((event) => event.customer_visible ?? true)
      .map((event) => ({
        id: event.id,
        eventType: event.event_type,
        title: event.title,
        body: event.body ?? null,
        createdAt: event.created_at,
      }))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  };
}

function mapAccountNotification(notification: {
  id: string;
  channel: string;
  subject: string;
  body: string;
  status: string;
  order_id?: string | null;
  rma_id?: string | null;
  read_at?: string | null;
  created_at: string;
}): AccountNotificationRow {
  return {
    id: notification.id,
    channel: notification.channel,
    subject: notification.subject,
    body: notification.body,
    status: notification.status,
    orderId: notification.order_id ?? null,
    rmaId: notification.rma_id ?? null,
    readAt: notification.read_at ?? null,
    createdAt: notification.created_at,
  };
}

function normalizeRmaAttachments(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      id: String(item.id ?? ""),
      label: String(item.label ?? item.name ?? "Attachment"),
      url: toAttachmentHref(String(item.url ?? "")) ?? "",
      note: typeof item.note === "string" ? item.note : null,
      createdAt: String(item.createdAt ?? item.created_at ?? ""),
    }))
    .filter((item) => item.id && item.url);
}

function summarizeActivity({
  orders,
  rmas,
  notifications = [],
}: {
  orders: AccountOrderRow[];
  rmas: AccountRmaRow[];
  notifications?: AccountNotificationRow[];
}): AccountActivity {
  return {
    orders,
    rmas,
    notifications,
    generatedAt: new Date().toISOString(),
    orderCount: orders.length,
    openRmaCount: rmas.filter(
      (rma) => !["completed", "rejected"].includes(rma.status),
    ).length,
    totalSpend: orders.reduce(
      (sum, order) => sum + order.total - (order.refundTotal ?? 0),
      0,
    ),
    unreadNotificationCount: notifications.filter((notification) => !notification.readAt)
      .length,
  };
}
