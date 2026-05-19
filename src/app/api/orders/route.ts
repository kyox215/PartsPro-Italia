import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { products } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/env";
import { parseRequestBody } from "@/lib/request";
import { hasStripeConfig, getStripe } from "@/lib/stripe";
import { getSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { orderSchema } from "@/lib/validations";
import { calculateLineTotal } from "@/lib/pricing";

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

  const lines = items.map((item) => {
    const product = products.find((candidate) => candidate.sku === item.sku);
    if (!product) {
      throw new Error(`Unknown SKU: ${item.sku}`);
    }
    return {
      product,
      quantity: item.quantity,
      totals: calculateLineTotal(product, item.quantity, true),
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.totals.subtotal, 0);
  const vat = lines.reduce((sum, line) => sum + line.totals.vat, 0);
  const total = subtotal + vat;
  const auth = await getAuthContext();

  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdminClient();
    const { error: orderError } = await supabase.from("orders").insert({
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

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      lines.map((line) => ({
        order_id: orderId,
        sku: line.product.sku,
        name: line.product.names.it,
        quantity: line.quantity,
        unit_price: line.totals.unitPrice,
        vat_rate: line.product.vatRate,
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
            name: line.product.names.it,
            metadata: { sku: line.product.sku },
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
