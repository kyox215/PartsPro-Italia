import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { products } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/env";
import { parseRequestBody } from "@/lib/request";
import { hasStripeConfig, getStripe } from "@/lib/stripe";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { orderSchema } from "@/lib/validations";
import { calculateLineTotal } from "@/lib/pricing";
import { getFulfillmentType } from "@/lib/checkout-lines";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = orderSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid order payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const orderId = crypto.randomUUID();
  const parsedItems = parseItems(parsed.data.items, parsed.data.itemsJson);
  const items = parsedItems.length
    ? parsedItems
    : parsed.data.items?.length
    ? parsed.data.items
    : [
        { sku: products[0].sku, quantity: 1 },
        { sku: products[1].sku, quantity: 2 },
      ];
  const auth = await getAuthContext();
  const isSupabaseCatalogConfigured = hasSupabasePublicConfig();
  const canWriteSupabaseOrders = hasSupabaseAdminConfig();
  let lines: OrderLine[];

  if (isSupabaseCatalogConfigured && !canWriteSupabaseOrders) {
    return orderError(
      request,
      parsed.data.locale,
      "SUPABASE_SERVICE_ROLE_KEY missing; order creation is disabled.",
      503,
    );
  }

  if (canWriteSupabaseOrders && !auth.user) {
    return orderError(
      request,
      parsed.data.locale,
      "Login is required to create B2B stock or preorder orders.",
      401,
    );
  }

  try {
    lines = canWriteSupabaseOrders
      ? await loadSupabaseOrderLines(items)
      : loadLocalOrderLines(items);
  } catch (error) {
    return orderError(
      request,
      parsed.data.locale,
      error instanceof Error ? error.message : "Unable to load order items",
      400,
    );
  }

  const subtotal = lines.reduce((sum, line) => sum + line.totals.subtotal, 0);
  const vat = lines.reduce((sum, line) => sum + line.totals.vat, 0);
  const total = subtotal + vat;

  if (canWriteSupabaseOrders) {
    const supabase = getSupabaseAdminClient();
    const { error: insertOrderError } = await supabase.from("orders").insert({
      id: orderId,
      profile_id: auth.user?.id ?? null,
      status:
        parsed.data.paymentMethod === "bank_transfer"
          ? "pending_payment"
          : "checkout_created",
      payment_method: parsed.data.paymentMethod,
      email: parsed.data.email || null,
      customer_name: parsed.data.name || null,
      company_name: parsed.data.companyName || null,
      vat_number: parsed.data.vatNumber || null,
      fiscal_code: parsed.data.fiscalCode || null,
      sdi: parsed.data.sdi || null,
      pec: parsed.data.pec || null,
      shipping_address: parsed.data.shippingAddress || null,
      subtotal,
      vat,
      total,
      currency: "EUR",
      metadata: parsed.data,
    });

    if (insertOrderError) {
      return NextResponse.json({ error: insertOrderError.message }, { status: 500 });
    }

    try {
      await reserveSupabaseInventory(supabase, orderId, lines);
    } catch (error) {
      await supabase.from("orders").delete().eq("id", orderId);
      return orderError(
        request,
        parsed.data.locale,
        error instanceof Error ? error.message : "Inventory reservation failed",
        409,
      );
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      lines.map((line) => ({
        order_id: orderId,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        unit_price: line.totals.unitPrice,
        vat_rate: line.vatRate,
        fulfillment_type: line.fulfillmentType,
        stock_qty: line.stockQty,
        preorder_qty: line.preorderQty,
        preorder_lead_time_min_days: line.preorderLeadTimeMinDays,
        preorder_lead_time_max_days: line.preorderLeadTimeMaxDays,
      })),
    );

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }
  }

  if (parsed.data.paymentMethod === "stripe" && hasStripeConfig()) {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${getSiteUrl()}/it/account?checkout=success&order=${orderId}`,
      cancel_url: `${getSiteUrl()}/it/cart?checkout=cancelled&order=${orderId}`,
      client_reference_id: orderId,
      customer_email: parsed.data.email || undefined,
      line_items: lines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(line.totals.unitPrice * 100),
          product_data: {
            name: line.name,
            metadata: { sku: line.sku },
          },
        },
      })),
      metadata: { orderId },
    });

    const result = {
      orderId,
      status: "checkout_created",
      checkoutUrl: session.url,
    };

    if (wantsRedirect(request) && session.url) {
      return NextResponse.redirect(session.url, 303);
    }

    return NextResponse.json(result);
  }

  const result = {
    orderId,
    status:
      parsed.data.paymentMethod === "bank_transfer"
        ? "pending_payment"
        : "stripe_not_configured",
    total,
    message:
      parsed.data.paymentMethod === "bank_transfer"
        ? "Bank transfer order created."
        : "Stripe config missing; order saved as checkout_created when Supabase is configured.",
  };

  if (wantsRedirect(request)) {
    const accountUrl = new URL(`/${parsed.data.locale}/account`, request.url);
    accountUrl.searchParams.set("order", orderId);
    accountUrl.searchParams.set("status", result.status);
    return NextResponse.redirect(accountUrl, 303);
  }

  return NextResponse.json(result);
}

function parseItems(
  items: Array<{ sku: string; quantity: number }> | undefined,
  itemsJson?: string,
) {
  if (items?.length) {
    return items;
  }

  if (!itemsJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(itemsJson);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => ({
        sku: String(item.sku ?? ""),
        quantity: Number(item.quantity ?? 0),
      }))
      .filter((item) => item.sku && item.quantity > 0);
  } catch {
    return [];
  }
}

function wantsRedirect(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const accept = request.headers.get("accept") ?? "";
  return contentType.includes("application/x-www-form-urlencoded") || accept.includes("text/html");
}

type OrderLine = {
  skuId?: string;
  inventoryId?: string;
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

type SupabaseSkuRow = {
  id: string;
  sku: string;
  moq: number;
  b2b_price: number | string;
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

function loadLocalOrderLines(items: Array<{ sku: string; quantity: number }>): OrderLine[] {
  return items.map((item) => {
    const product = products.find((candidate) => candidate.sku === item.sku);
    if (!product) {
      throw new Error(`Unknown SKU: ${item.sku}`);
    }
    const totals = calculateLineTotal(product, item.quantity, true);
    const fulfillmentType = getFulfillmentType(
      item.quantity,
      product.stock,
      product.incoming ?? 0,
    );
    const stockQty = Math.min(item.quantity, product.stock);
    const preorderQty = Math.max(item.quantity - stockQty, 0);

    return {
      sku: product.sku,
      name: product.names.it,
      quantity: item.quantity,
      vatRate: product.vatRate,
      totals,
      fulfillmentType,
      stockQty,
      preorderQty,
      preorderLeadTimeMinDays: preorderQty > 0 ? 7 : null,
      preorderLeadTimeMaxDays: preorderQty > 0 ? 14 : null,
      stockReserved: 0,
      incomingReserved: 0,
    };
  });
}

async function loadSupabaseOrderLines(
  items: Array<{ sku: string; quantity: number }>,
): Promise<OrderLine[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("skus")
    .select(
      `
      id,
      sku,
      moq,
      b2b_price,
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
      items.map((item) => item.sku),
    );

  if (error) throw new Error(error.message);

  return items.map((item) => {
    const row = (data ?? []).find((candidate) => candidate.sku === item.sku) as
      | SupabaseSkuRow
      | undefined;
    if (!row) throw new Error(`Unknown SKU: ${item.sku}`);
    if (item.quantity < Number(row.moq ?? 1)) {
      throw new Error(`SKU ${item.sku} requires MOQ ${row.moq}`);
    }

    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    const inventory = row.inventory?.[0];
    const availableStock = Math.max(
      Number(inventory?.stock_on_hand ?? 0) - Number(inventory?.stock_reserved ?? 0),
      0,
    );
    const incomingAvailable = Math.max(
      Number(inventory?.incoming_qty ?? 0) -
        Number(inventory?.incoming_reserved ?? 0),
      0,
    );
    const totalAvailable = availableStock + incomingAvailable;

    if (!inventory) throw new Error(`Inventory row missing for SKU ${item.sku}`);
    if (item.quantity > totalAvailable) {
      throw new Error(
        `SKU ${item.sku} has only ${totalAvailable} available/preorder units`,
      );
    }

    const unitPrice = Number(row.b2b_price ?? 0);
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

async function reserveSupabaseInventory(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  orderId: string,
  lines: OrderLine[],
) {
  for (const line of lines) {
    if (!line.inventoryId || !line.skuId) continue;

    const { error } = await supabase
      .from("inventory")
      .update({
        stock_reserved: line.stockReserved + line.stockQty,
        incoming_reserved: line.incomingReserved + line.preorderQty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", line.inventoryId);

    if (error) throw new Error(error.message);

    if (line.stockQty > 0) {
      await supabase.from("inventory_movements").insert({
        sku_id: line.skuId,
        order_id: orderId,
        movement_type: "reserve_stock",
        quantity: line.stockQty,
        reserved_delta: line.stockQty,
        note: "Order stock reservation",
      });
    }

    if (line.preorderQty > 0) {
      await supabase.from("inventory_movements").insert({
        sku_id: line.skuId,
        order_id: orderId,
        movement_type: "reserve_incoming",
        quantity: line.preorderQty,
        incoming_reserved_delta: line.preorderQty,
        note: "Order preorder reservation",
      });
    }
  }
}

function orderError(
  request: Request,
  locale: string,
  message: string,
  status: number,
) {
  if (wantsRedirect(request)) {
    const url = new URL(`/${locale}/checkout`, request.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, 303);
  }

  return NextResponse.json({ error: message }, { status });
}
