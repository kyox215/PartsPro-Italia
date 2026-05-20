import { NextResponse } from "next/server";
import { canViewB2BPrice, getAuthContext } from "@/lib/auth";
import { checkoutCartCookieName } from "@/lib/checkout-cart-cookie";
import { getSiteUrl } from "@/lib/env";
import {
  createSupabaseOrderWithReservations,
  getInitialFulfillmentStatus,
  getInitialOrderStatus,
  getPaymentStatus,
  getReservationExpiry,
  loadSupabaseOrderLines,
  releaseOrderReservations,
  type PaymentMethod,
} from "@/lib/order-workflow";
import { parseRequestBody } from "@/lib/request";
import { getStripe, hasStripeConfig } from "@/lib/stripe";
import { getSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { orderSchema } from "@/lib/validations";

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

  const auth = await getAuthContext();
  const items = parseItems(parsed.data.items, parsed.data.itemsJson);
  const paymentMethod = parsed.data.paymentMethod as PaymentMethod;

  if (items.length === 0) {
    return orderError(request, parsed.data.locale, "Cart is empty.", 400);
  }

  if (!hasSupabasePublicConfig() || !hasSupabaseAdminConfig()) {
    return orderError(
      request,
      parsed.data.locale,
      "Supabase service role is required to create real orders.",
      503,
    );
  }

  if (!auth.user) {
    return orderError(
      request,
      parsed.data.locale,
      "Login is required to create stock or preorder orders.",
      401,
    );
  }

  if (paymentMethod === "stripe" && !hasStripeConfig()) {
    return orderError(
      request,
      parsed.data.locale,
      "Stripe is not configured. Choose cash or bank transfer.",
      503,
    );
  }

  const orderId = crypto.randomUUID();
  const useB2BPrice = canViewB2BPrice(auth);
  const supabase = getSupabaseAdminClient();
  const now = new Date();
  const reservationExpiresAt = getReservationExpiry(now);

  let lines;
  try {
    lines = await loadSupabaseOrderLines(items, useB2BPrice);
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

  try {
    await createSupabaseOrderWithReservations({
      supabase,
      orderId,
      profileId: auth.user.id,
      status: getInitialOrderStatus(paymentMethod),
      paymentStatus: getPaymentStatus(paymentMethod),
      fulfillmentStatus: getInitialFulfillmentStatus(lines),
      reservationExpiresAt: reservationExpiresAt.toISOString(),
      reservedAt: now.toISOString(),
      paymentMethod,
      email: parsed.data.email || auth.user.email || null,
      customerName: parsed.data.name || null,
      companyName: parsed.data.companyName || null,
      vatNumber: parsed.data.vatNumber || null,
      fiscalCode: parsed.data.fiscalCode || null,
      sdi: parsed.data.sdi || null,
      pec: parsed.data.pec || null,
      shippingAddress: parsed.data.shippingAddress || null,
      metadata: parsed.data,
      lines,
    });
  } catch (error) {
    return orderError(
      request,
      parsed.data.locale,
      error instanceof Error ? error.message : "Unable to create order reservation",
      409,
    );
  }

  if (paymentMethod === "stripe") {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${getSiteUrl()}/${parsed.data.locale}/account/orders/${orderId}?checkout=success`,
        cancel_url: `${getSiteUrl()}/${parsed.data.locale}/cart?checkout=cancelled&order=${orderId}`,
        client_reference_id: orderId,
        customer_email: parsed.data.email || auth.user.email || undefined,
        line_items: lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(line.totals.unitPrice * (1 + line.vatRate) * 100),
            product_data: {
              name: line.name,
              metadata: { sku: line.sku },
            },
          },
        })),
        metadata: { orderId },
        expires_at: Math.floor(reservationExpiresAt.getTime() / 1000),
      });

      await supabase
        .from("orders")
        .update({
          stripe_checkout_session_id: session.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (wantsRedirect(request) && session.url) {
        const response = NextResponse.redirect(session.url, 303);
        response.cookies.delete(checkoutCartCookieName);
        return response;
      }

      const response = NextResponse.json({
        orderId,
        status: "checkout_created",
        checkoutUrl: session.url,
      });
      response.cookies.delete(checkoutCartCookieName);
      return response;
    } catch (error) {
      await releaseOrderReservations({
        orderId,
        paymentStatus: "failed",
        status: "cancelled",
        note: "Stripe checkout creation failed",
      });
      return orderError(
        request,
        parsed.data.locale,
        error instanceof Error ? error.message : "Unable to create Stripe checkout",
        502,
      );
    }
  }

  const result = {
    orderId,
    status: "pending_payment",
    paymentStatus: getPaymentStatus(paymentMethod),
    total,
    message:
      paymentMethod === "cash"
        ? "Cash order created."
        : "Bank transfer order created.",
  };

  if (wantsRedirect(request)) {
    const accountUrl = new URL(
      `/${parsed.data.locale}/account/orders/${orderId}`,
      request.url,
    );
    accountUrl.searchParams.set("status", result.paymentStatus);
    const response = NextResponse.redirect(accountUrl, 303);
    response.cookies.delete(checkoutCartCookieName);
    return response;
  }

  const response = NextResponse.json(result);
  response.cookies.delete(checkoutCartCookieName);
  return response;
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
