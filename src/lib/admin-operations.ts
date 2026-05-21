import { toAttachmentHref } from "@/lib/admin-attachment-storage";
import { products } from "@/lib/catalog";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { isUuid } from "@/lib/order-number";

export type AdminOrderRow = {
  id: string;
  orderNumber?: string | null;
  profileId?: string | null;
  status: string;
  paymentStatus?: string | null;
  fulfillmentStatus?: string | null;
  paymentMethod: string;
  email: string | null;
  customerName: string | null;
  companyName: string | null;
  vatNumber?: string | null;
  fiscalCode?: string | null;
  sdi?: string | null;
  pec?: string | null;
  shippingAddress?: string | null;
  subtotal?: number;
  vat?: number;
  total: number;
  refundTotal?: number;
  currency: string;
  reservationExpiresAt?: string | null;
  releasedAt?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
  fulfilledAt?: string | null;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shipmentNote?: string | null;
  shippedAt?: string | null;
  customerNote?: string | null;
  adminNote?: string | null;
  createdAt: string;
  items: Array<{
    sku: string;
    name: string;
    nameIt?: string | null;
    nameZh?: string | null;
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
    recordedBy?: string | null;
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
    providerStatus?: string | null;
    note?: string | null;
    createdAt: string;
  }>;
  timelineEvents: Array<{
    id: string;
    eventType: string;
    title: string;
    body?: string | null;
    actorProfileId?: string | null;
    customerVisible?: boolean;
    createdAt: string;
  }>;
  notifications: Array<{
    id: string;
    status: string;
    recipientEmail: string;
    subject: string;
    errorMessage?: string | null;
    sentAt?: string | null;
    createdAt: string;
  }>;
};

export type AdminOrderTimelineRow = {
  id: string;
  orderId: string;
  orderNumber?: string | null;
  eventType: string;
  title: string;
  body?: string | null;
  actorProfileId?: string | null;
  customerVisible?: boolean;
  createdAt: string;
  customerName?: string | null;
  companyName?: string | null;
  email?: string | null;
};

export async function getAdminOrderRows(): Promise<AdminOrderRow[]> {
  if (!hasSupabaseAdminConfig()) {
    return [
      {
        id: "demo-order-1001",
        orderNumber: "PP-260521-0001",
        status: "pending_payment",
        profileId: "demo-profile",
        paymentStatus: "pending_bank_transfer",
        fulfillmentStatus: "awaiting_preorder",
        paymentMethod: "bank_transfer",
        email: "riparatore@example.it",
        customerName: "Marco Rossi",
        companyName: "Rossi Riparazioni SRL",
        vatNumber: "IT12345678901",
        shippingAddress: "Via Demo 1, Milano",
        subtotal: 425.61,
        vat: 93.63,
        total: 519.24,
        refundTotal: 0,
        currency: "EUR",
        reservationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        releasedAt: null,
        paidAt: null,
        cancelledAt: null,
        fulfilledAt: null,
        shippingCarrier: "DHL",
        trackingNumber: "DEMO123456",
        trackingUrl: "https://www.dhl.com/",
        shipmentNote: "Demo shipment reference.",
        shippedAt: null,
        customerNote: "Demo: shipment details appear here after dispatch.",
        adminNote: null,
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
            fulfillmentType: "mixed",
            stockQty: 5,
            preorderQty: 5,
            preorderLeadTimeMinDays: 7,
            preorderLeadTimeMaxDays: 14,
          },
        ],
        paymentRecords: [],
        refunds: [],
        timelineEvents: [
          {
            id: "demo-event-1",
            eventType: "order_created",
            title: "Demo order created",
            body: "Timeline events will appear here after real order actions.",
            actorProfileId: null,
            createdAt: new Date().toISOString(),
          },
        ],
        notifications: [],
      },
    ];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items (*)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to load admin orders", error);
    return [];
  }

  return hydrateAdminOrderItemNames((data ?? []).map(mapAdminOrder));
}

export async function getAdminOrderRowsForCustomer({
  profileId,
  email,
  companyName,
}: Readonly<{
  profileId?: string | null;
  email?: string | null;
  companyName?: string | null;
}>): Promise<AdminOrderRow[]> {
  if (!hasSupabaseAdminConfig()) {
    const orders = await getAdminOrderRows();
    const normalizedEmail = email?.toLowerCase();
    const normalizedCompanyName = companyName?.toLowerCase();
    return orders.filter((order) => {
      if (profileId && order.profileId === profileId) return true;
      if (normalizedEmail && order.email?.toLowerCase() === normalizedEmail) return true;
      return Boolean(
        normalizedCompanyName &&
          order.companyName?.toLowerCase() === normalizedCompanyName,
      );
    });
  }

  const supabase = getSupabaseAdminClient();
  const queries = [];
  if (profileId) {
    queries.push(
      supabase
        .from("orders")
        .select("*, order_items (*)")
        .eq("profile_id", profileId)
        .limit(100),
    );
  }
  if (email) {
    queries.push(
      supabase
        .from("orders")
        .select("*, order_items (*)")
        .eq("email", email)
        .limit(100),
    );
  }
  if (companyName) {
    queries.push(
      supabase
        .from("orders")
        .select("*, order_items (*)")
        .eq("company_name", companyName)
        .limit(100),
    );
  }

  if (queries.length === 0) return [];

  const results = await Promise.all(queries);
  const rowsById = new Map<string, AdminOrderRow>();
  results.forEach((result) => {
    if (result.error) {
      console.error("Failed to load customer orders", result.error);
      return;
    }
    (result.data ?? []).forEach((order) => {
      rowsById.set(order.id, mapAdminOrder(order));
    });
  });

  const rows = [...rowsById.values()].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  return hydrateAdminOrderItemNames(rows);
}

export async function getAdminOrderById(
  orderIdOrNumber: string,
): Promise<AdminOrderRow | null> {
  if (!hasSupabaseAdminConfig()) {
    const rows = await getAdminOrderRows();
    return (
      rows.find(
        (order) =>
          order.id === orderIdOrNumber || order.orderNumber === orderIdOrNumber,
      ) ?? null
    );
  }

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("orders")
    .select("*, order_items (*), order_payment_records (*), order_refunds (*), order_timeline_events (*), notification_events (*)");
  query = isUuid(orderIdOrNumber)
    ? query.eq("id", orderIdOrNumber)
    : query.eq("order_number", orderIdOrNumber);
  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Failed to load admin order detail", error);
    return null;
  }

  if (!data) return null;

  const [order] = await hydrateAdminOrderItemNames([mapAdminOrder(data)]);
  return order ?? null;
}

export async function getAdminOrderTimelineRows(
  limit = 200,
): Promise<AdminOrderTimelineRow[]> {
  if (!hasSupabaseAdminConfig()) {
    const orders = await getAdminOrderRows();
    return orders.flatMap((order) =>
      order.timelineEvents.map((event) => ({
        ...event,
        orderId: order.id,
        orderNumber: order.orderNumber,
        companyName: order.companyName,
        customerName: order.customerName,
        email: order.email,
      })),
    );
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("order_timeline_events")
    .select("id, order_id, event_type, title, body, actor_profile_id, customer_visible, created_at, orders (*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load admin order timeline", error);
    return [];
  }

  return (data ?? []).map((event) => {
    const order = Array.isArray(event.orders) ? event.orders[0] : event.orders;
    return {
      id: event.id,
      orderId: event.order_id,
      orderNumber: order?.order_number ?? null,
      eventType: event.event_type,
      title: event.title,
      body: event.body ?? null,
      actorProfileId: event.actor_profile_id ?? null,
      customerVisible: event.customer_visible ?? true,
      createdAt: event.created_at,
      customerName: order?.customer_name ?? null,
      companyName: order?.company_name ?? null,
      email: order?.email ?? null,
    };
  });
}

export async function getAdminDashboardMetrics() {
  if (!hasSupabaseAdminConfig()) {
    const [orders, preorderIncomingTotal] = await Promise.all([
      getAdminOrderRows(),
      getPreorderIncomingTotal(),
    ]);

    return summarizeDashboardMetrics({
      orders,
      preorderIncomingTotal,
    });
  }

  const [orderSummary, preorderIncomingTotal] = await Promise.all([
    getAdminOrderMetricRows(),
    getPreorderIncomingTotal(),
  ]);

  return {
    orders: [],
    orderCount: orderSummary.orderCount,
    pendingPaymentCount: orderSummary.pendingPaymentCount,
    pendingCashCount: orderSummary.pendingCashCount,
    pendingBankTransferCount: orderSummary.pendingBankTransferCount,
    pendingCardCount: orderSummary.pendingCardCount,
    expiringReservationCount: orderSummary.expiringReservationCount,
    preorderAllocationCount: orderSummary.preorderAllocationCount,
    preorderIncomingTotal,
    revenueTotal: orderSummary.revenueTotal,
  };
}

function summarizeDashboardMetrics({
  orders,
  preorderIncomingTotal,
}: Readonly<{
  orders: AdminOrderRow[];
  preorderIncomingTotal: number;
}>) {
  return {
    orders,
    orderCount: orders.length,
    pendingPaymentCount: orders.filter((order) => order.status === "pending_payment")
      .length,
    pendingCashCount: orders.filter((order) => order.paymentStatus === "pending_cash")
      .length,
    pendingBankTransferCount: orders.filter(
      (order) => order.paymentStatus === "pending_bank_transfer",
    ).length,
    pendingCardCount: orders.filter((order) => order.paymentStatus === "pending_card")
      .length,
    expiringReservationCount: orders.filter(isAdminReservationExpiringSoon).length,
    preorderAllocationCount: orders.filter(
      (order) => order.fulfillmentStatus === "awaiting_preorder",
    ).length,
    preorderIncomingTotal,
    revenueTotal: orders.reduce(
      (sum, order) => sum + order.total - (order.refundTotal ?? 0),
      0,
    ),
  };
}

async function getAdminOrderMetricRows() {
  const supabase = getSupabaseAdminClient();
  const { data, error, count } = await supabase
    .from("orders")
    .select(
      "status, payment_status, fulfillment_status, total, refund_total, reservation_expires_at, released_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Failed to load admin dashboard order metrics", error);
    return {
      orderCount: 0,
      pendingPaymentCount: 0,
      pendingCashCount: 0,
      pendingBankTransferCount: 0,
      pendingCardCount: 0,
      expiringReservationCount: 0,
      preorderAllocationCount: 0,
      revenueTotal: 0,
    };
  }

  const summary = {
    orderCount: count ?? data?.length ?? 0,
    pendingPaymentCount: 0,
    pendingCashCount: 0,
    pendingBankTransferCount: 0,
    pendingCardCount: 0,
    expiringReservationCount: 0,
    preorderAllocationCount: 0,
    revenueTotal: 0,
  };

  (data ?? []).forEach((order) => {
    const paymentStatus = order.payment_status ?? "";
    if (paymentStatus === "pending_cash") summary.pendingCashCount += 1;
    if (paymentStatus === "pending_bank_transfer") {
      summary.pendingBankTransferCount += 1;
    }
    if (paymentStatus === "pending_card") summary.pendingCardCount += 1;
    if (["pending_cash", "pending_bank_transfer", "pending_card"].includes(paymentStatus)) {
      summary.pendingPaymentCount += 1;
    }
    if (order.fulfillment_status === "awaiting_preorder") {
      summary.preorderAllocationCount += 1;
    }
    if (
      order.reservation_expires_at &&
      !order.released_at &&
      paymentStatus !== "paid" &&
      new Date(order.reservation_expires_at).getTime() <= Date.now() + 6 * 60 * 60 * 1000
    ) {
      summary.expiringReservationCount += 1;
    }
    summary.revenueTotal += Number(order.total ?? 0) - Number(order.refund_total ?? 0);
  });

  return summary;
}

function isAdminReservationExpiringSoon(order: AdminOrderRow) {
  if (!order.reservationExpiresAt || order.releasedAt || order.paymentStatus === "paid") {
    return false;
  }
  const expiresAt = new Date(order.reservationExpiresAt).getTime();
  return expiresAt <= Date.now() + 6 * 60 * 60 * 1000;
}

async function getPreorderIncomingTotal() {
  if (!hasSupabaseAdminConfig()) {
    return products.reduce((sum, product) => sum + (product.incoming ?? 0), 0);
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("inventory")
    .select("incoming_qty, incoming_reserved");

  if (error) {
    console.error("Failed to load incoming inventory total", error);
    return 0;
  }

  return (data ?? []).reduce(
    (sum, row) =>
      sum +
      Math.max(
        Number(row.incoming_qty ?? 0) - Number(row.incoming_reserved ?? 0),
        0,
      ),
    0,
  );
}

async function hydrateAdminOrderItemNames(orders: AdminOrderRow[]) {
  if (orders.length === 0 || !hasSupabaseAdminConfig()) return orders;

  const skus = [
    ...new Set(
      orders.flatMap((order) =>
        order.items
          .filter((item) => !item.name || item.name === item.sku)
          .map((item) => item.sku),
      ),
    ),
  ];

  if (skus.length === 0) return orders;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("catalog_private_items")
    .select("sku, name_it, name_zh")
    .in("sku", skus);

  if (error) {
    console.error("Failed to hydrate order item product names", error);
    return orders;
  }

  const namesBySku = new Map(
    (data ?? []).map((row) => [
      row.sku,
      {
        it: row.name_it ?? null,
        zh: row.name_zh ?? null,
      },
    ]),
  );

  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => {
      const catalogName = namesBySku.get(item.sku);
      if (!catalogName) return item;

      return {
        ...item,
        name:
          item.name && item.name !== item.sku
            ? item.name
            : catalogName.it ?? catalogName.zh ?? item.name,
        nameIt: catalogName.it,
        nameZh: catalogName.zh,
      };
    }),
  }));
}

function mapAdminOrder(order: {
  id: string;
  order_number?: string | null;
  profile_id?: string | null;
  status: string;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  payment_method: string;
  email: string | null;
  customer_name: string | null;
  company_name: string | null;
  vat_number?: string | null;
  fiscal_code?: string | null;
  sdi?: string | null;
  pec?: string | null;
  shipping_address?: string | null;
  subtotal?: number | string | null;
  vat?: number | string | null;
  total: number | string | null;
  refund_total?: number | string | null;
  currency: string | null;
  reservation_expires_at?: string | null;
  released_at?: string | null;
  paid_at?: string | null;
  cancelled_at?: string | null;
  fulfilled_at?: string | null;
  shipping_carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  shipment_note?: string | null;
  shipped_at?: string | null;
  customer_note?: string | null;
  admin_note?: string | null;
  created_at: string;
  order_items?: Array<{
    sku: string;
    name: string;
    quantity: number;
    unit_price: number | string;
    fulfillment_type?: string;
    stock_qty?: number;
    preorder_qty?: number;
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
    recorded_by?: string | null;
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
    provider_status?: string | null;
    note?: string | null;
    created_at: string;
  }> | null;
  order_timeline_events?: Array<{
    id: string;
    event_type: string;
    title: string;
    body?: string | null;
    actor_profile_id?: string | null;
    customer_visible?: boolean | null;
    created_at: string;
  }> | null;
  notification_events?: Array<{
    id: string;
    status: string;
    recipient_email: string;
    subject: string;
    error_message?: string | null;
    sent_at?: string | null;
    created_at: string;
  }> | null;
}): AdminOrderRow {
  return {
    id: order.id,
    orderNumber: order.order_number ?? null,
    profileId: order.profile_id ?? null,
    status: order.status,
    paymentStatus: order.payment_status ?? null,
    fulfillmentStatus: order.fulfillment_status ?? null,
    paymentMethod: order.payment_method,
    email: order.email,
    customerName: order.customer_name,
    companyName: order.company_name,
    vatNumber: order.vat_number,
    fiscalCode: order.fiscal_code,
    sdi: order.sdi,
    pec: order.pec,
    shippingAddress: order.shipping_address,
    subtotal: Number(order.subtotal ?? 0),
    vat: Number(order.vat ?? 0),
    total: Number(order.total ?? 0),
    refundTotal: Number(order.refund_total ?? 0),
    currency: order.currency ?? "EUR",
    reservationExpiresAt: order.reservation_expires_at ?? null,
    releasedAt: order.released_at ?? null,
    paidAt: order.paid_at ?? null,
    cancelledAt: order.cancelled_at ?? null,
    fulfilledAt: order.fulfilled_at ?? null,
    shippingCarrier: order.shipping_carrier ?? null,
    trackingNumber: order.tracking_number ?? null,
    trackingUrl: order.tracking_url ?? null,
    shipmentNote: order.shipment_note ?? null,
    shippedAt: order.shipped_at ?? null,
    customerNote: order.customer_note ?? null,
    adminNote: order.admin_note ?? null,
    createdAt: order.created_at,
    items: (order.order_items ?? []).map((item) => ({
      sku: item.sku,
      name: item.name,
      nameIt: null,
      nameZh: null,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price ?? 0),
      fulfillmentType: item.fulfillment_type,
      stockQty: item.stock_qty,
      preorderQty: item.preorder_qty,
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
        recordedBy: record.recorded_by ?? null,
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
        providerStatus: refund.provider_status ?? null,
        note: refund.note ?? null,
        createdAt: refund.created_at,
      }))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    timelineEvents: (order.order_timeline_events ?? [])
      .map((event) => ({
        id: event.id,
        eventType: event.event_type,
        title: event.title,
        body: event.body ?? null,
        actorProfileId: event.actor_profile_id ?? null,
        customerVisible: event.customer_visible ?? true,
        createdAt: event.created_at,
      }))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    notifications: mapNotifications(order.notification_events),
  };
}

function mapNotifications(
  rows:
    | Array<{
        id: string;
        status: string;
        recipient_email: string;
        subject: string;
        error_message?: string | null;
        sent_at?: string | null;
        created_at: string;
      }>
    | null
    | undefined,
) {
  return (rows ?? [])
    .map((row) => ({
      id: row.id,
      status: row.status,
      recipientEmail: row.recipient_email,
      subject: row.subject,
      errorMessage: row.error_message ?? null,
      sentAt: row.sent_at ?? null,
      createdAt: row.created_at,
    }))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
