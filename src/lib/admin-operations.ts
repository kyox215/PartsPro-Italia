import { products } from "@/lib/catalog";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

export type AdminOrderRow = {
  id: string;
  status: string;
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
  createdAt: string;
};

export async function getAdminOrderRows(): Promise<AdminOrderRow[]> {
  if (!hasSupabaseAdminConfig()) {
    return [
      {
        id: "demo-order-1001",
        status: "pending_payment",
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
    .select("*, order_items (*)")
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
        createdAt: new Date().toISOString(),
      },
    ];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rmas")
    .select(
      "id, order_id, profile_id, status, order_number, sku, quantity, issue_type, description, installation_tested, installed, created_at",
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
      "id, order_id, profile_id, status, order_number, sku, quantity, issue_type, description, installation_tested, installed, created_at",
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
  status: string;
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
}): AdminOrderRow {
  return {
    id: order.id,
    status: order.status,
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
  };
}

function mapAdminRma(row: {
  id: string;
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
  created_at: string;
}): AdminRmaRow {
  return {
    id: row.id,
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
    createdAt: row.created_at,
  };
}
