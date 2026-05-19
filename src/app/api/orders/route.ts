import { NextResponse } from "next/server";
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
  const items = parsed.data.items?.length
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

  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdminClient();
    await supabase.from("orders").insert({
      id: orderId,
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

    await supabase.from("order_items").insert(
      lines.map((line) => ({
        order_id: orderId,
        sku: line.product.sku,
        name: line.product.names.it,
        quantity: line.quantity,
        unit_price: line.totals.unitPrice,
        vat_rate: line.product.vatRate,
      })),
    );
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

    return NextResponse.json({
      orderId,
      status: "checkout_created",
      checkoutUrl: session.url,
    });
  }

  return NextResponse.json({
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
  });
}
