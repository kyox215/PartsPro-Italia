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
  currency: string;
  reservationExpiresAt?: string | null;
  paidAt?: string | null;
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

export type AccountRmaRow = {
  id: string;
  status: string;
  orderNumber: string;
  sku: string;
  quantity: number;
  issueType: string;
  description: string | null;
  createdAt: string;
};

export type AccountActivity = {
  orders: AccountOrderRow[];
  rmas: AccountRmaRow[];
  orderCount: number;
  openRmaCount: number;
  totalSpend: number;
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
          currency: "EUR",
          reservationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          paidAt: null,
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
        },
      ],
      rmas: [
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
      ],
    });
  }

  if (!auth.user || !hasSupabasePublicConfig()) {
    return summarizeActivity({ orders: [], rmas: [] });
  }

  const supabase = await getSupabaseServerClient();
  const [ordersResult, rmasResult] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, status, payment_status, fulfillment_status, payment_method, total, currency, reservation_expires_at, paid_at, created_at, order_items (*)",
      )
      .eq("profile_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("rmas")
      .select("id, status, order_number, sku, quantity, issue_type, description, created_at")
      .eq("profile_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (ordersResult.error) {
    console.error("Failed to load account orders", ordersResult.error);
  }

  if (rmasResult.error) {
    console.error("Failed to load account RMAs", rmasResult.error);
  }

  return summarizeActivity({
    orders: (ordersResult.data ?? []).map(mapAccountOrder),
    rmas: (rmasResult.data ?? []).map(mapAccountRma),
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
    .select("id, status, payment_status, fulfillment_status, payment_method, total, currency, reservation_expires_at, paid_at, created_at, order_items (*)")
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
    .select("id, status, order_number, sku, quantity, issue_type, description, created_at")
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
  currency: string | null;
  reservation_expires_at?: string | null;
  paid_at?: string | null;
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
}): AccountOrderRow {
  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.payment_status ?? null,
    fulfillmentStatus: order.fulfillment_status ?? null,
    paymentMethod: order.payment_method,
    total: Number(order.total ?? 0),
    currency: order.currency ?? "EUR",
    reservationExpiresAt: order.reservation_expires_at ?? null,
    paidAt: order.paid_at ?? null,
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
  };
}

function mapAccountRma(rma: {
  id: string;
  status: string;
  order_number: string;
  sku: string;
  quantity: number;
  issue_type: string;
  description: string | null;
  created_at: string;
}): AccountRmaRow {
  return {
    id: rma.id,
    status: rma.status,
    orderNumber: rma.order_number,
    sku: rma.sku,
    quantity: rma.quantity,
    issueType: rma.issue_type,
    description: rma.description,
    createdAt: rma.created_at,
  };
}

function summarizeActivity({
  orders,
  rmas,
}: {
  orders: AccountOrderRow[];
  rmas: AccountRmaRow[];
}): AccountActivity {
  return {
    orders,
    rmas,
    orderCount: orders.length,
    openRmaCount: rmas.filter((rma) => rma.status !== "completed").length,
    totalSpend: orders.reduce((sum, order) => sum + order.total, 0),
  };
}
