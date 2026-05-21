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
  remainingTotal: number;
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

export type AdminInventoryMovementRow = {
  id: string;
  sku: string;
  movementType: string;
  quantity: number;
  stockDelta: number;
  reservedDelta: number;
  incomingDelta: number;
  incomingReservedDelta: number;
  note: string | null;
  createdAt: string;
};

export type AdminInventoryAlertRow = {
  inventoryId: string;
  skuId: string;
  sku: string;
  name: string;
  stockOnHand: number;
  stockReserved: number;
  incomingQty: number;
  incomingReserved: number;
  reorderPoint: number;
  safetyStock: number;
  reason: "low_stock" | "below_safety" | "oversold" | "incoming_reserved";
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
    remainingTotal: Math.max(
      Number(row.ordered_total ?? 0) -
        Number(row.received_total ?? 0) -
        Number(row.missing_total ?? 0),
      0,
    ),
    createdAt: row.created_at,
  }));
}

export async function getOpenSupplierPurchaseItems(
  purchaseOrderId?: string,
): Promise<
  SupplierPurchaseOrderItemRow[]
> {
  if (!hasSupabaseAdminConfig()) return [];

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("supplier_purchase_order_items")
    .select(
      "id, purchase_order_id, sku_id, ean13, sku, supplier_name, original_name, ordered_qty, received_qty, missing_qty, cost_price, status, created_at",
    )
    .in("status", ["ordered", "partial"])
    .order("created_at", { ascending: true })
    .limit(300);

  if (purchaseOrderId) {
    query = query.eq("purchase_order_id", purchaseOrderId);
  }

  const { data, error } = await query;

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

export async function getAdminInventoryMovements(
  limit = 80,
): Promise<AdminInventoryMovementRow[]> {
  if (!hasSupabaseAdminConfig()) {
    return [
      {
        id: "demo-movement-1",
        sku: "APL-IP14-SCR-SO-BLK",
        movementType: "receive_stock",
        quantity: 10,
        stockDelta: 10,
        reservedDelta: 0,
        incomingDelta: -10,
        incomingReservedDelta: 0,
        note: "Demo supplier stock received",
        createdAt: new Date().toISOString(),
      },
    ];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("inventory_movements")
    .select(
      `
      id,
      movement_type,
      quantity,
      stock_delta,
      reserved_delta,
      incoming_delta,
      incoming_reserved_delta,
      note,
      created_at,
      skus ( sku )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load inventory movements", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const sku = Array.isArray(row.skus) ? row.skus[0] : row.skus;

    return {
      id: row.id,
      sku: sku?.sku ?? "-",
      movementType: row.movement_type,
      quantity: Number(row.quantity ?? 0),
      stockDelta: Number(row.stock_delta ?? 0),
      reservedDelta: Number(row.reserved_delta ?? 0),
      incomingDelta: Number(row.incoming_delta ?? 0),
      incomingReservedDelta: Number(row.incoming_reserved_delta ?? 0),
      note: row.note ?? null,
      createdAt: row.created_at,
    };
  });
}

export async function getAdminInventoryAlerts(): Promise<AdminInventoryAlertRow[]> {
  if (!hasSupabaseAdminConfig()) {
    return [
      {
        inventoryId: "demo-inventory-1",
        skuId: "demo-sku-1",
        sku: "APL-IP13-BAT-HQ",
        name: "Batteria iPhone 13 alta qualita",
        stockOnHand: 3,
        stockReserved: 1,
        incomingQty: 0,
        incomingReserved: 0,
        reorderPoint: 5,
        safetyStock: 2,
        reason: "low_stock",
      },
    ];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("inventory")
    .select(
      `
      id,
      sku_id,
      stock_on_hand,
      stock_reserved,
      incoming_qty,
      incoming_reserved,
      reorder_point,
      safety_stock,
      skus (
        sku,
        products ( name_it )
      )
    `,
    )
    .eq("warehouse_code", "MAIN")
    .limit(300);

  if (error) {
    console.error("Failed to load inventory alerts", error);
    return [];
  }

  return (data ?? [])
    .map((row) => {
      const sku = Array.isArray(row.skus) ? row.skus[0] : row.skus;
      const product = Array.isArray(sku?.products) ? sku?.products[0] : sku?.products;
      const stockOnHand = Number(row.stock_on_hand ?? 0);
      const stockReserved = Number(row.stock_reserved ?? 0);
      const incomingQty = Number(row.incoming_qty ?? 0);
      const incomingReserved = Number(row.incoming_reserved ?? 0);
      const available = stockOnHand - stockReserved;
      const reorderPoint = Number(row.reorder_point ?? 0);
      const safetyStock = Number(row.safety_stock ?? 0);
      let reason: AdminInventoryAlertRow["reason"] | null = null;

      if (available < 0) reason = "oversold";
      else if (safetyStock > 0 && available <= safetyStock) reason = "below_safety";
      else if (reorderPoint > 0 && available <= reorderPoint) reason = "low_stock";
      else if (incomingReserved > incomingQty) reason = "incoming_reserved";

      if (!reason) return null;

      return {
        inventoryId: row.id,
        skuId: row.sku_id,
        sku: sku?.sku ?? "-",
        name: product?.name_it ?? sku?.sku ?? "-",
        stockOnHand,
        stockReserved,
        incomingQty,
        incomingReserved,
        reorderPoint,
        safetyStock,
        reason,
      };
    })
    .filter((row): row is AdminInventoryAlertRow => Boolean(row));
}
