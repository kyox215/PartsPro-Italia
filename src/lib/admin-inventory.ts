import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

export type InventorySettings = {
  b2bMarkup: number;
  retailMarkup: number;
  preorderLeadTimeMinDays: number;
  preorderLeadTimeMaxDays: number;
};

export type SupplierPurchaseOrderRow = {
  id: string;
  sourceFilename: string;
  status: string;
  orderedTotal: number;
  receivedTotal: number;
  missingTotal: number;
  createdAt: string;
};

export type SupplierPurchaseOrderItemRow = {
  id: string;
  purchaseOrderId: string;
  skuId: string;
  sku: string;
  ean13: string;
  originalName: string;
  supplierName: string;
  orderedQty: number;
  receivedQty: number;
  missingQty: number;
  remainingQty: number;
  costPrice: number;
  status: string;
  createdAt: string;
};

const defaultSettings: InventorySettings = {
  b2bMarkup: 1.5,
  retailMarkup: 2,
  preorderLeadTimeMinDays: 7,
  preorderLeadTimeMaxDays: 14,
};

export async function getInventorySettings(): Promise<InventorySettings> {
  if (!hasSupabaseAdminConfig()) return defaultSettings;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("inventory_settings")
    .select(
      "b2b_markup, retail_markup, preorder_lead_time_min_days, preorder_lead_time_max_days",
    )
    .eq("id", true)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Failed to load inventory settings", error);
    return defaultSettings;
  }

  return {
    b2bMarkup: Number(data.b2b_markup ?? defaultSettings.b2bMarkup),
    retailMarkup: Number(data.retail_markup ?? defaultSettings.retailMarkup),
    preorderLeadTimeMinDays: Number(
      data.preorder_lead_time_min_days ??
        defaultSettings.preorderLeadTimeMinDays,
    ),
    preorderLeadTimeMaxDays: Number(
      data.preorder_lead_time_max_days ??
        defaultSettings.preorderLeadTimeMaxDays,
    ),
  };
}

export async function getSupplierPurchaseOrders(): Promise<
  SupplierPurchaseOrderRow[]
> {
  if (!hasSupabaseAdminConfig()) return [];

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("supplier_purchase_orders")
    .select(
      "id, source_filename, status, ordered_total, received_total, missing_total, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Failed to load supplier purchase orders", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    sourceFilename: row.source_filename,
    status: row.status,
    orderedTotal: Number(row.ordered_total ?? 0),
    receivedTotal: Number(row.received_total ?? 0),
    missingTotal: Number(row.missing_total ?? 0),
    createdAt: row.created_at,
  }));
}

export async function getOpenSupplierPurchaseItems(): Promise<
  SupplierPurchaseOrderItemRow[]
> {
  if (!hasSupabaseAdminConfig()) return [];

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("supplier_purchase_order_items")
    .select(
      "id, purchase_order_id, sku_id, ean13, sku, supplier_name, original_name, ordered_qty, received_qty, missing_qty, cost_price, status, created_at",
    )
    .in("status", ["ordered", "partial"])
    .order("created_at", { ascending: true })
    .limit(80);

  if (error) {
    console.error("Failed to load supplier purchase items", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const orderedQty = Number(row.ordered_qty ?? 0);
    const receivedQty = Number(row.received_qty ?? 0);
    const missingQty = Number(row.missing_qty ?? 0);

    return {
      id: row.id,
      purchaseOrderId: row.purchase_order_id,
      skuId: row.sku_id,
      sku: row.sku,
      ean13: row.ean13,
      originalName: row.original_name,
      supplierName: row.supplier_name,
      orderedQty,
      receivedQty,
      missingQty,
      remainingQty: Math.max(orderedQty - receivedQty - missingQty, 0),
      costPrice: Number(row.cost_price ?? 0),
      status: row.status,
      createdAt: row.created_at,
    };
  });
}
