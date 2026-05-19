import type { AuthContext } from "@/lib/auth";
import { products } from "@/lib/catalog";
import {
  getSupabaseServerClient,
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";

export type AccountOrderRow = {
  id: string;
  status: string;
  paymentMethod: string;
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
          paymentMethod: "bank_transfer",
          total: 519.24,
          currency: "EUR",
          createdAt: new Date().toISOString(),
          items: [
            {
              sku: products[0].sku,
              name: products[0].names.it,
              quantity: 5,
              unitPrice: products[0].b2bPrice,
            },
            {
              sku: products[1].sku,
              name: products[1].names.it,
              quantity: 10,
              unitPrice: products[1].b2bPrice,
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
      .select("id, status, payment_method, total, currency, created_at, order_items (*)")
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
    orders: (ordersResult.data ?? []).map((order) => ({
      id: order.id,
      status: order.status,
      paymentMethod: order.payment_method,
      total: Number(order.total ?? 0),
      currency: order.currency ?? "EUR",
      createdAt: order.created_at,
      items: (order.order_items ?? []).map(
        (item: {
          sku: string;
          name: string;
          quantity: number;
          unit_price: number | string;
          fulfillment_type?: string | null;
          stock_qty?: number | null;
          preorder_qty?: number | null;
        }) => ({
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price ?? 0),
          fulfillmentType: item.fulfillment_type ?? undefined,
          stockQty: item.stock_qty ?? undefined,
          preorderQty: item.preorder_qty ?? undefined,
        }),
      ),
    })),
    rmas: (rmasResult.data ?? []).map((rma) => ({
      id: rma.id,
      status: rma.status,
      orderNumber: rma.order_number,
      sku: rma.sku,
      quantity: rma.quantity,
      issueType: rma.issue_type,
      description: rma.description,
      createdAt: rma.created_at,
    })),
  });
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
