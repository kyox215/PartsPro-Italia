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
  status: string;
  orderNumber: string;
  sku: string;
  quantity: number;
  issueType: string;
  description: string | null;
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

  return (data ?? []).map((order) => ({
    id: order.id,
    status: order.status,
    paymentMethod: order.payment_method,
    email: order.email,
    customerName: order.customer_name,
    companyName: order.company_name,
    total: Number(order.total ?? 0),
    currency: order.currency ?? "EUR",
    createdAt: order.created_at,
    items: (order.order_items ?? []).map(
      (item: {
        sku: string;
        name: string;
        quantity: number;
        unit_price: number | string;
        fulfillment_type?: string;
        stock_qty?: number;
        preorder_qty?: number;
      }) => ({
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price ?? 0),
        fulfillmentType: item.fulfillment_type,
        stockQty: item.stock_qty,
        preorderQty: item.preorder_qty,
      }),
    ),
  }));
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
        status: "submitted",
        orderNumber: "demo-order-1001",
        sku: products[0].sku,
        quantity: 1,
        issueType: "touch_issue",
        description: "Touch intermittente prima dell'installazione.",
        createdAt: new Date().toISOString(),
      },
    ];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rmas")
    .select("id, status, order_number, sku, quantity, issue_type, description, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to load RMAs", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    orderNumber: row.order_number,
    sku: row.sku,
    quantity: row.quantity,
    issueType: row.issue_type,
    description: row.description,
    createdAt: row.created_at,
  }));
}

export async function getAdminDashboardMetrics() {
  const [orders, b2bApplications, rmas] = await Promise.all([
    getAdminOrderRows(),
    getAdminB2BApplicationRows(),
    getAdminRmaRows(),
  ]);

  return {
    orders,
    b2bApplications,
    rmas,
    orderCount: orders.length,
    pendingB2BCount: b2bApplications.filter((item) => item.status === "pending")
      .length,
    openRmaCount: rmas.filter((item) => item.status !== "completed").length,
    revenueTotal: orders.reduce((sum, order) => sum + order.total, 0),
  };
}
