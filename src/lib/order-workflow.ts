import { getFulfillmentType, normalizeCartItems, type CartInputItem } from "@/lib/cart-quote";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

export const reservationHours = 24;

export type PaymentMethod = "stripe" | "cash" | "bank_transfer";

export type OrderLine = {
  skuId: string;
  inventoryId: string;
  sku: string;
  name: string;
  quantity: number;
  vatRate: number;
  totals: {
    unitPrice: number;
    subtotal: number;
    vat: number;
  };
  fulfillmentType: "stock" | "preorder" | "mixed";
  stockQty: number;
  preorderQty: number;
  preorderLeadTimeMinDays: number | null;
  preorderLeadTimeMaxDays: number | null;
  stockReserved: number;
  incomingReserved: number;
};

type SupabaseClient = ReturnType<typeof getSupabaseAdminClient>;

type SupabaseSkuRow = {
  id: string;
  sku: string;
  moq: number;
  b2b_price: number | string;
  retail_price: number | string;
  vat_rate: number | string;
  preorder_lead_time_min_days: number | null;
  preorder_lead_time_max_days: number | null;
  products:
    | { name_it: string }
    | Array<{ name_it: string }>
    | null;
  inventory:
    | Array<{
        id: string;
        stock_on_hand: number;
        stock_reserved: number;
        incoming_qty: number;
        incoming_reserved: number;
      }>
    | null;
};

type WorkflowOrder = {
  id: string;
  status: string;
  payment_method: string;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  released_at?: string | null;
  fulfilled_at?: string | null;
  order_items?: WorkflowOrderItem[] | null;
};

type WorkflowOrderItem = {
  id: string;
  sku: string;
  quantity: number;
  stock_qty?: number | null;
  preorder_qty?: number | null;
  fulfillment_type?: string | null;
};

type InventoryRow = {
  id: string;
  sku_id: string;
  stock_on_hand: number;
  stock_reserved: number;
  incoming_qty: number;
  incoming_reserved: number;
};

export function getPaymentStatus(paymentMethod: PaymentMethod) {
  if (paymentMethod === "stripe") return "pending_card";
  if (paymentMethod === "cash") return "pending_cash";
  return "pending_bank_transfer";
}

export function getInitialOrderStatus(paymentMethod: PaymentMethod) {
  return paymentMethod === "stripe" ? "checkout_created" : "pending_payment";
}

export function getInitialFulfillmentStatus(lines: OrderLine[]) {
  return lines.some((line) => line.preorderQty > 0) ? "awaiting_preorder" : "reserved";
}

export function getReservationExpiry(now = new Date()) {
  return new Date(now.getTime() + reservationHours * 60 * 60 * 1000);
}

export async function loadSupabaseOrderLines(
  items: CartInputItem[],
  useB2BPrice: boolean,
): Promise<OrderLine[]> {
  const normalizedItems = normalizeCartItems(items);
  if (normalizedItems.length === 0) {
    throw new Error("Cart is empty.");
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("skus")
    .select(
      `
      id,
      sku,
      moq,
      b2b_price,
      retail_price,
      vat_rate,
      preorder_lead_time_min_days,
      preorder_lead_time_max_days,
      products ( name_it ),
      inventory (
        id,
        stock_on_hand,
        stock_reserved,
        incoming_qty,
        incoming_reserved
      )
    `,
    )
    .in(
      "sku",
      normalizedItems.map((item) => item.sku),
    );

  if (error) throw new Error(error.message);

  return normalizedItems.map((item) => {
    const row = (data ?? []).find((candidate) => candidate.sku === item.sku) as
      | SupabaseSkuRow
      | undefined;
    if (!row) throw new Error(`Unknown SKU: ${item.sku}`);
    if (item.quantity < Number(row.moq ?? 1)) {
      throw new Error(`SKU ${item.sku} requires MOQ ${row.moq}`);
    }

    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    const inventory = row.inventory?.[0];
    if (!inventory) throw new Error(`Inventory row missing for SKU ${item.sku}`);

    const availableStock = Math.max(
      Number(inventory.stock_on_hand ?? 0) - Number(inventory.stock_reserved ?? 0),
      0,
    );
    const incomingAvailable = Math.max(
      Number(inventory.incoming_qty ?? 0) - Number(inventory.incoming_reserved ?? 0),
      0,
    );
    const totalAvailable = availableStock + incomingAvailable;

    if (item.quantity > totalAvailable) {
      throw new Error(
        `SKU ${item.sku} has only ${totalAvailable} available/preorder units`,
      );
    }

    const unitPrice = Number(
      useB2BPrice ? row.b2b_price ?? 0 : row.retail_price ?? 0,
    );
    const vatRate = Number(row.vat_rate ?? 0.22);
    const stockQty = Math.min(item.quantity, availableStock);
    const preorderQty = Math.max(item.quantity - stockQty, 0);

    return {
      skuId: row.id,
      inventoryId: inventory.id,
      sku: row.sku,
      name: product?.name_it ?? row.sku,
      quantity: item.quantity,
      vatRate,
      totals: {
        unitPrice,
        subtotal: unitPrice * item.quantity,
        vat: unitPrice * item.quantity * vatRate,
      },
      fulfillmentType: getFulfillmentType(
        item.quantity,
        availableStock,
        incomingAvailable,
      ),
      stockQty,
      preorderQty,
      preorderLeadTimeMinDays:
        preorderQty > 0 ? Number(row.preorder_lead_time_min_days ?? 7) : null,
      preorderLeadTimeMaxDays:
        preorderQty > 0 ? Number(row.preorder_lead_time_max_days ?? 14) : null,
      stockReserved: Number(inventory.stock_reserved ?? 0),
      incomingReserved: Number(inventory.incoming_reserved ?? 0),
    };
  });
}

export async function reserveSupabaseInventory(
  supabase: SupabaseClient,
  orderId: string,
  lines: OrderLine[],
) {
  for (const line of lines) {
    const nextStockReserved = line.stockReserved + line.stockQty;
    const nextIncomingReserved = line.incomingReserved + line.preorderQty;

    const { data, error } = await supabase
      .from("inventory")
      .update({
        stock_reserved: nextStockReserved,
        incoming_reserved: nextIncomingReserved,
        updated_at: new Date().toISOString(),
      })
      .eq("id", line.inventoryId)
      .eq("stock_reserved", line.stockReserved)
      .eq("incoming_reserved", line.incomingReserved)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      throw new Error(`Inventory changed while reserving SKU ${line.sku}; please retry.`);
    }

    if (line.stockQty > 0) {
      await insertInventoryMovement(supabase, {
        skuId: line.skuId,
        orderId,
        movementType: "reserve_stock",
        quantity: line.stockQty,
        reservedDelta: line.stockQty,
        note: "Order stock reservation",
      });
    }

    if (line.preorderQty > 0) {
      await insertInventoryMovement(supabase, {
        skuId: line.skuId,
        orderId,
        movementType: "reserve_incoming",
        quantity: line.preorderQty,
        incomingReservedDelta: line.preorderQty,
        note: "Order preorder reservation",
      });
    }
  }
}

export async function releaseOrderReservations({
  orderId,
  paymentStatus = "cancelled",
  status = "cancelled",
  note = "Order reservation released",
}: {
  orderId: string;
  paymentStatus?: "cancelled" | "failed";
  status?: "cancelled";
  note?: string;
}) {
  if (!hasSupabaseAdminConfig()) {
    return { released: 0, demoMode: true };
  }

  const supabase = getSupabaseAdminClient();
  const order = await loadWorkflowOrder(supabase, orderId);
  if (!order || order.released_at || order.fulfilled_at) {
    return { released: 0, demoMode: false };
  }

  const skuMap = await getSkuIdMap(
    supabase,
    (order.order_items ?? []).map((item) => item.sku),
  );
  let released = 0;

  for (const item of order.order_items ?? []) {
    const skuId = skuMap.get(item.sku);
    if (!skuId) continue;
    const stockQty = Number(item.stock_qty ?? 0);
    const preorderQty = Number(item.preorder_qty ?? 0);
    if (stockQty <= 0 && preorderQty <= 0) continue;

    const inventory = await loadMainInventory(supabase, skuId);
    if (!inventory) continue;

    const { error } = await supabase
      .from("inventory")
      .update({
        stock_reserved: Math.max(Number(inventory.stock_reserved ?? 0) - stockQty, 0),
        incoming_reserved: Math.max(
          Number(inventory.incoming_reserved ?? 0) - preorderQty,
          0,
        ),
        updated_at: new Date().toISOString(),
      })
      .eq("id", inventory.id);

    if (error) throw new Error(error.message);

    await insertInventoryMovement(supabase, {
      skuId,
      orderId,
      movementType: "release_reservation",
      quantity: stockQty + preorderQty,
      reservedDelta: -stockQty,
      incomingReservedDelta: -preorderQty,
      note,
    });
    released += stockQty + preorderQty;
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("orders")
    .update({
      status,
      payment_status: paymentStatus,
      fulfillment_status: "cancelled",
      released_at: now,
      cancelled_at: now,
      updated_at: now,
      admin_note: note,
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
  return { released, demoMode: false };
}

export async function markOrderPaid({
  orderId,
  stripeCheckoutSessionId,
  note,
}: {
  orderId: string;
  stripeCheckoutSessionId?: string;
  note?: string;
}) {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const payload: Record<string, string> = {
    status: "paid",
    payment_status: "paid",
    paid_at: now,
    updated_at: now,
  };

  if (stripeCheckoutSessionId) {
    payload.stripe_checkout_session_id = stripeCheckoutSessionId;
  }

  if (note) {
    payload.admin_note = note;
  }

  const { error } = await supabase.from("orders").update(payload).eq("id", orderId);
  if (error) throw new Error(error.message);
}

export async function confirmManualPayment({
  orderId,
  expectedMethod,
}: {
  orderId: string;
  expectedMethod: "cash" | "bank_transfer";
}) {
  const supabase = getSupabaseAdminClient();
  const order = await loadWorkflowOrder(supabase, orderId);
  if (!order) throw new Error("Order not found.");
  if (order.payment_method !== expectedMethod) {
    throw new Error(`Order payment method is ${order.payment_method}, not ${expectedMethod}.`);
  }
  await markOrderPaid({
    orderId,
    note:
      expectedMethod === "cash"
        ? "Cash payment confirmed by admin"
        : "Bank transfer confirmed by admin",
  });
}

export async function startOrderPicking(orderId: string) {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("orders")
    .update({
      status: "processing",
      fulfillment_status: "picking",
      updated_at: now,
    })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
}

export async function allocatePreorderStock(orderId: string) {
  const supabase = getSupabaseAdminClient();
  const order = await loadWorkflowOrder(supabase, orderId);
  if (!order) throw new Error("Order not found.");

  const preorderItems = (order.order_items ?? []).filter(
    (item) => Number(item.preorder_qty ?? 0) > 0,
  );
  const skuMap = await getSkuIdMap(
    supabase,
    preorderItems.map((item) => item.sku),
  );
  let allocated = 0;

  for (const item of preorderItems) {
    const preorderQty = Number(item.preorder_qty ?? 0);
    const skuId = skuMap.get(item.sku);
    if (!skuId || preorderQty <= 0) continue;

    const inventory = await loadMainInventory(supabase, skuId);
    if (!inventory) throw new Error(`Inventory row missing for SKU ${item.sku}.`);

    const availableStock = Math.max(
      Number(inventory.stock_on_hand ?? 0) - Number(inventory.stock_reserved ?? 0),
      0,
    );

    if (availableStock < preorderQty) {
      throw new Error(
        `SKU ${item.sku} needs ${preorderQty} arrived units, only ${availableStock} available.`,
      );
    }

    const { error: inventoryError } = await supabase
      .from("inventory")
      .update({
        stock_reserved: Number(inventory.stock_reserved ?? 0) + preorderQty,
        incoming_reserved: Math.max(
          Number(inventory.incoming_reserved ?? 0) - preorderQty,
          0,
        ),
        updated_at: new Date().toISOString(),
      })
      .eq("id", inventory.id);

    if (inventoryError) throw new Error(inventoryError.message);

    const nextStockQty = Number(item.stock_qty ?? 0) + preorderQty;
    const { error: itemError } = await supabase
      .from("order_items")
      .update({
        stock_qty: nextStockQty,
        preorder_qty: 0,
        fulfillment_type: "stock",
      })
      .eq("id", item.id);

    if (itemError) throw new Error(itemError.message);

    await insertInventoryMovement(supabase, {
      skuId,
      orderId,
      movementType: "allocate_preorder",
      quantity: preorderQty,
      reservedDelta: preorderQty,
      incomingReservedDelta: -preorderQty,
      note: "Arrived preorder stock allocated to order",
    });
    allocated += preorderQty;
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("orders")
    .update({
      fulfillment_status: "reserved",
      updated_at: now,
      admin_note: allocated > 0 ? `Allocated ${allocated} preorder units` : "No preorder units to allocate",
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
  return { allocated };
}

export async function shipOrPickupOrder({
  orderId,
  mode,
}: {
  orderId: string;
  mode: "shipped" | "picked_up";
}) {
  const supabase = getSupabaseAdminClient();
  const order = await loadWorkflowOrder(supabase, orderId);
  if (!order) throw new Error("Order not found.");
  if (order.fulfilled_at) return { deducted: 0 };

  const remainingPreorder = (order.order_items ?? []).reduce(
    (sum, item) => sum + Number(item.preorder_qty ?? 0),
    0,
  );
  if (remainingPreorder > 0) {
    throw new Error("Allocate preorder stock before shipping or pickup.");
  }

  const skuMap = await getSkuIdMap(
    supabase,
    (order.order_items ?? []).map((item) => item.sku),
  );
  let deducted = 0;

  for (const item of order.order_items ?? []) {
    const qty = Number(item.stock_qty ?? item.quantity ?? 0);
    if (qty <= 0) continue;
    const skuId = skuMap.get(item.sku);
    if (!skuId) continue;
    const inventory = await loadMainInventory(supabase, skuId);
    if (!inventory) throw new Error(`Inventory row missing for SKU ${item.sku}.`);
    if (Number(inventory.stock_on_hand ?? 0) < qty) {
      throw new Error(`SKU ${item.sku} has insufficient physical stock to ship.`);
    }

    const { error } = await supabase
      .from("inventory")
      .update({
        stock_on_hand: Math.max(Number(inventory.stock_on_hand ?? 0) - qty, 0),
        stock_reserved: Math.max(Number(inventory.stock_reserved ?? 0) - qty, 0),
        updated_at: new Date().toISOString(),
      })
      .eq("id", inventory.id);

    if (error) throw new Error(error.message);

    await insertInventoryMovement(supabase, {
      skuId,
      orderId,
      movementType: "ship_stock",
      quantity: qty,
      stockDelta: -qty,
      reservedDelta: -qty,
      note: mode === "shipped" ? "Order shipped" : "Order picked up",
    });
    deducted += qty;
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("orders")
    .update({
      status: mode === "shipped" ? "shipped" : "completed",
      fulfillment_status: mode,
      fulfilled_at: now,
      updated_at: now,
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
  return { deducted };
}

export async function completeOrder(orderId: string) {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("orders")
    .update({
      status: "completed",
      fulfillment_status: "completed",
      updated_at: now,
    })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
}

export async function extendOrderReservation(orderId: string) {
  const supabase = getSupabaseAdminClient();
  const expiresAt = getReservationExpiry().toISOString();
  const { error } = await supabase
    .from("orders")
    .update({
      reservation_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
      admin_note: "Reservation extended 24 hours",
    })
    .eq("id", orderId)
    .is("released_at", null);

  if (error) throw new Error(error.message);
  return { reservationExpiresAt: expiresAt };
}

export async function releaseExpiredReservations() {
  if (!hasSupabaseAdminConfig()) {
    return { processed: 0, released: 0, demoMode: true };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .in("payment_status", ["pending_card", "pending_cash", "pending_bank_transfer"])
    .is("released_at", null)
    .lt("reservation_expires_at", new Date().toISOString())
    .limit(100);

  if (error) throw new Error(error.message);

  let released = 0;
  for (const order of data ?? []) {
    const result = await releaseOrderReservations({
      orderId: order.id,
      paymentStatus: "cancelled",
      status: "cancelled",
      note: "Reservation expired after 24 hours",
    });
    released += result.released;
  }

  return { processed: data?.length ?? 0, released, demoMode: false };
}

async function loadWorkflowOrder(supabase: SupabaseClient, orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, payment_method, payment_status, fulfillment_status, released_at, fulfilled_at, order_items ( id, sku, quantity, stock_qty, preorder_qty, fulfillment_type )",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as WorkflowOrder | null;
}

async function getSkuIdMap(supabase: SupabaseClient, skus: string[]) {
  const uniqueSkus = [...new Set(skus.filter(Boolean))];
  const result = new Map<string, string>();
  if (uniqueSkus.length === 0) return result;

  const { data, error } = await supabase
    .from("skus")
    .select("id, sku")
    .in("sku", uniqueSkus);

  if (error) throw new Error(error.message);
  (data ?? []).forEach((row) => result.set(row.sku, row.id));
  return result;
}

async function loadMainInventory(supabase: SupabaseClient, skuId: string) {
  const { data, error } = await supabase
    .from("inventory")
    .select("id, sku_id, stock_on_hand, stock_reserved, incoming_qty, incoming_reserved")
    .eq("sku_id", skuId)
    .eq("warehouse_code", "MAIN")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as InventoryRow | null;
}

async function insertInventoryMovement(
  supabase: SupabaseClient,
  payload: {
    skuId: string;
    orderId: string;
    movementType:
      | "reserve_stock"
      | "reserve_incoming"
      | "release_reservation"
      | "allocate_preorder"
      | "ship_stock";
    quantity: number;
    stockDelta?: number;
    reservedDelta?: number;
    incomingReservedDelta?: number;
    note: string;
  },
) {
  const { error } = await supabase.from("inventory_movements").insert({
    sku_id: payload.skuId,
    order_id: payload.orderId,
    movement_type: payload.movementType,
    quantity: payload.quantity,
    stock_delta: payload.stockDelta ?? 0,
    reserved_delta: payload.reservedDelta ?? 0,
    incoming_reserved_delta: payload.incomingReservedDelta ?? 0,
    note: payload.note,
  });

  if (error) throw new Error(error.message);
}
