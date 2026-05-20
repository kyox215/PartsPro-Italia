import { toAttachmentHref } from "@/lib/admin-attachment-storage";
import { products } from "@/lib/catalog";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

export type AdminOrderRow = {
  id: string;
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

export type AdminB2BApplicationRow = {
  id: string;
  status: string;
  companyName: string;
  vatNumber: string | null;
  email: string | null;
  createdAt: string;
};

export type AdminRmaRow = {
  id: string;
  rmaNumber?: string | null;
  orderId?: string | null;
  profileId?: string | null;
  status: string;
  orderNumber: string;
  sku: string;
  quantity: number;
  issueType: string;
  description: string | null;
  installationTested?: boolean | null;
  installed?: boolean | null;
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

export async function getAdminOrderRows(): Promise<AdminOrderRow[]> {
  if (!hasSupabaseAdminConfig()) {
    return [
      {
        id: "demo-order-1001",
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

  return (data ?? []).map(mapAdminOrder);
}

export async function getAdminOrderById(
  orderId: string,
): Promise<AdminOrderRow | null> {
  if (!hasSupabaseAdminConfig()) {
    const rows = await getAdminOrderRows();
    return rows.find((order) => order.id === orderId) ?? null;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items (*), order_payment_records (*), order_timeline_events (*), notification_events (*)")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load admin order detail", error);
    return null;
  }

  return data ? mapAdminOrder(data) : null;
}

export async function getAdminB2BApplicationRows(): Promise<AdminB2BApplicationRow[]> {
  if (!hasSupabaseAdminConfig()) {
    return [
      {
        id: "demo-b2b-1",
        status: "pending",
        companyName: "Centro Riparazioni Milano",
        vatNumber: "IT12345678901",
        email: "buyer@example.it",
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo-b2b-2",
        status: "pending",
        companyName: "Tech Service Torino",
        vatNumber: "IT10987654321",
        email: "orders@example.it",
        createdAt: new Date().toISOString(),
      },
    ];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("b2b_applications")
    .select("id, status, company_name, vat_number, email, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to load B2B applications", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    companyName: row.company_name,
    vatNumber: row.vat_number,
    email: row.email,
    createdAt: row.created_at,
  }));
}

export async function getAdminRmaRows(): Promise<AdminRmaRow[]> {
  if (!hasSupabaseAdminConfig()) {
    return [
      {
        id: "demo-rma-1",
        rmaNumber: "RMA-DEMO-001",
        orderId: "demo-order-1001",
        profileId: null,
        status: "submitted",
        orderNumber: "demo-order-1001",
        sku: products[0].sku,
        quantity: 1,
        issueType: "touch_issue",
        description: "Touch intermittente prima dell'installazione.",
        installationTested: true,
        installed: false,
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
            body: "RMA processing events will appear here.",
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
    .from("rmas")
    .select(
      "id, rma_number, order_id, profile_id, status, order_number, sku, quantity, issue_type, description, installation_tested, installed, resolution_type, resolution_note, refund_amount, replacement_sku, closed_at, attachments, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to load RMAs", error);
    return [];
  }

  return (data ?? []).map(mapAdminRma);
}

export async function getAdminRmaById(rmaId: string): Promise<AdminRmaRow | null> {
  if (!hasSupabaseAdminConfig()) {
    const rows = await getAdminRmaRows();
    return rows.find((rma) => rma.id === rmaId) ?? null;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rmas")
    .select(
      "id, rma_number, order_id, profile_id, status, order_number, sku, quantity, issue_type, description, installation_tested, installed, resolution_type, resolution_note, refund_amount, replacement_sku, closed_at, attachments, created_at, rma_events (*), notification_events (*)",
    )
    .eq("id", rmaId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load admin RMA detail", error);
    return null;
  }

  return data ? mapAdminRma(data) : null;
}

export async function getAdminDashboardMetrics() {
  const [orders, b2bApplications, rmas, preorderIncomingTotal] = await Promise.all([
    getAdminOrderRows(),
    getAdminB2BApplicationRows(),
    getAdminRmaRows(),
    getPreorderIncomingTotal(),
  ]);

  return {
    orders,
    b2bApplications,
    rmas,
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
    expiringReservationCount: orders.filter((order) => {
      if (!order.reservationExpiresAt || order.releasedAt || order.paymentStatus === "paid") {
        return false;
      }
      const expiresAt = new Date(order.reservationExpiresAt).getTime();
      return expiresAt <= Date.now() + 6 * 60 * 60 * 1000;
    }).length,
    preorderAllocationCount: orders.filter(
      (order) => order.fulfillmentStatus === "awaiting_preorder",
    ).length,
    pendingB2BCount: b2bApplications.filter((item) => item.status === "pending")
      .length,
    openRmaCount: rmas.filter((item) => item.status !== "completed").length,
    preorderIncomingTotal,
    revenueTotal: orders.reduce((sum, order) => sum + order.total, 0),
  };
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

function mapAdminOrder(order: {
  id: string;
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

function mapAdminRma(row: {
  id: string;
  rma_number?: string | null;
  order_id?: string | null;
  profile_id?: string | null;
  status: string;
  order_number: string;
  sku: string;
  quantity: number;
  issue_type: string;
  description: string | null;
  installation_tested?: boolean | null;
  installed?: boolean | null;
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
}): AdminRmaRow {
  return {
    id: row.id,
    rmaNumber: row.rma_number ?? null,
    orderId: row.order_id,
    profileId: row.profile_id,
    status: row.status,
    orderNumber: row.order_number,
    sku: row.sku,
    quantity: row.quantity,
    issueType: row.issue_type,
    description: row.description,
    installationTested: row.installation_tested,
    installed: row.installed,
    resolutionType: row.resolution_type ?? null,
    resolutionNote: row.resolution_note ?? null,
    refundAmount:
      row.refund_amount === null || row.refund_amount === undefined
        ? null
        : Number(row.refund_amount),
    replacementSku: row.replacement_sku ?? null,
    closedAt: row.closed_at ?? null,
    attachments: normalizeRmaAttachments(row.attachments),
    createdAt: row.created_at,
    events: (row.rma_events ?? [])
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
    notifications: mapNotifications(row.notification_events),
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
