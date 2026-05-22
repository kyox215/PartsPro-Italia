import type { CheckoutCartInput } from "@/admin/schemas/order-checkout";
import {
  getAccountCompany,
  getCheckoutCompanyMissingFields,
} from "@/lib/account-company";
import { canViewB2BPrice, getAuthContext } from "@/lib/auth";
import {
  loadCartQuote,
  normalizeCartItems,
} from "@/lib/cart-quote";
import { getSiteUrl } from "@/lib/env";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import {
  createOrderReservation,
  getCheckoutInitialOrderStatus,
  getCheckoutPaymentStatus,
  getCheckoutReservationExpiry,
  getOrderTransactionClient,
  loadCheckoutOrderLines,
  releaseOrderReservation,
  updateOrderStripeCheckoutSession,
  type PaymentMethod,
} from "@/admin/repositories/order-transactions";
import { getStripe, hasStripeConfig } from "@/lib/stripe";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import type { orderSchema } from "@/lib/validations";
import type { z } from "zod";

type CheckoutOrderInput = z.infer<typeof orderSchema>;

export type CheckoutOrderSuccess = {
  checkoutUrl?: string | null;
  message?: string;
  orderId: string;
  orderNumber: string;
  paymentStatus: string;
  status: string;
  total: number;
};

export type CheckoutOrderFailure = {
  error: {
    code: string;
    message: string;
    missingFields?: string[];
  };
  ok: false;
  status: number;
};

export type CheckoutOrderResult =
  | { data: CheckoutOrderSuccess; ok: true }
  | CheckoutOrderFailure;

export async function quoteCheckoutCart(input: CheckoutCartInput) {
  const locale = normalizeLocale(input.locale);
  return loadCartQuote({ locale, items: input.items });
}

export function prepareCheckoutCart(input: CheckoutCartInput) {
  const locale = normalizeLocale(input.locale);
  const items = normalizeCartItems(input.items);

  if (items.length === 0) {
    return {
      error: {
        code: "EMPTY_CART",
        message: "Cart is empty.",
      },
      ok: false as const,
      status: 400,
    };
  }

  return {
    data: {
      items,
      redirectTo: localizePath(locale, "/checkout"),
    },
    ok: true as const,
  };
}

export async function createCheckoutOrder(
  input: CheckoutOrderInput,
): Promise<CheckoutOrderResult> {
  const locale = normalizeLocale(input.locale);
  const auth = await getAuthContext();
  const items = parseCheckoutOrderItems(input.items, input.itemsJson);
  const paymentMethod = input.paymentMethod as PaymentMethod;

  if (items.length === 0) {
    return checkoutOrderError("EMPTY_CART", "Cart is empty.", 400);
  }

  if (!hasSupabasePublicConfig() || !hasSupabaseAdminConfig()) {
    return checkoutOrderError(
      "SUPABASE_NOT_CONFIGURED",
      "Supabase service role is required to create real orders.",
      503,
    );
  }

  if (!auth.user) {
    return checkoutOrderError(
      "LOGIN_REQUIRED",
      "Login is required to create stock or preorder orders.",
      401,
    );
  }

  if (paymentMethod === "stripe" && !hasStripeConfig()) {
    return checkoutOrderError(
      "STRIPE_NOT_CONFIGURED",
      "Stripe is not configured. Choose cash or bank transfer.",
      503,
    );
  }

  const useB2BPrice = canViewB2BPrice(auth);
  const { company } = await getAccountCompany(auth);
  const requiresCompanyProfile = !auth.isAdmin && useB2BPrice;
  const missingCompanyFields = requiresCompanyProfile
    ? getCheckoutCompanyMissingFields(company)
    : [];

  if (missingCompanyFields.length > 0) {
    return {
      error: {
        code: "COMPANY_PROFILE_REQUIRED",
        message: "Company profile is required for wholesale checkout.",
        missingFields: missingCompanyFields,
      },
      ok: false,
      status: 409,
    };
  }

  const orderId = crypto.randomUUID();
  const now = new Date();
  const reservationExpiresAt = getCheckoutReservationExpiry(now);

  let lines;
  try {
    lines = await loadCheckoutOrderLines(items, useB2BPrice);
  } catch (error) {
    return checkoutOrderError(
      "ORDER_LINES_INVALID",
      getErrorMessage(error, "Unable to load order items"),
      400,
    );
  }

  const subtotal = lines.reduce((sum, line) => sum + line.totals.subtotal, 0);
  const vat = lines.reduce((sum, line) => sum + line.totals.vat, 0);
  const total = subtotal + vat;

  let orderNumber = orderId;
  try {
    const createdOrder = await createOrderReservation({
      supabase: getOrderTransactionClient(),
      orderId,
      profileId: auth.user.id,
      status: getCheckoutInitialOrderStatus(paymentMethod),
      paymentStatus: getCheckoutPaymentStatus(paymentMethod),
      reservationExpiresAt: reservationExpiresAt.toISOString(),
      reservedAt: now.toISOString(),
      paymentMethod,
      email: auth.user.email || null,
      customerName: company?.contactName || null,
      companyName: company?.companyName || null,
      vatNumber: company?.vatNumber || null,
      fiscalCode: company?.fiscalCode || null,
      sdi: company?.sdi || null,
      pec: company?.pec || null,
      shippingAddress: company?.shippingAddress || null,
      metadata: {
        ...input,
        companyProfileId: company?.id ?? null,
        companyProfileRequired: requiresCompanyProfile,
      },
      lines,
    });
    orderNumber = createdOrder.order_number ?? orderId;
  } catch (error) {
    return checkoutOrderError(
      "ORDER_CREATE_FAILED",
      getErrorMessage(error, "Unable to create order reservation"),
      409,
    );
  }

  if (paymentMethod === "stripe") {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${getSiteUrl()}/${locale}/account/orders/${encodeURIComponent(orderNumber)}?checkout=success`,
        cancel_url: `${getSiteUrl()}/${locale}/cart?checkout=cancelled&order=${encodeURIComponent(orderNumber)}`,
        client_reference_id: orderId,
        customer_email: auth.user.email || undefined,
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

      await updateOrderStripeCheckoutSession({
        orderId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      });

      return {
        data: {
          checkoutUrl: session.url,
          orderId,
          orderNumber,
          paymentStatus: getCheckoutPaymentStatus(paymentMethod),
          status: "checkout_created",
          total,
        },
        ok: true,
      };
    } catch (error) {
      await releaseOrderReservation({
        orderId,
        paymentStatus: "failed",
        status: "cancelled",
        note: "Stripe checkout creation failed",
      });
      return checkoutOrderError(
        "STRIPE_CHECKOUT_FAILED",
        getErrorMessage(error, "Unable to create Stripe checkout"),
        502,
      );
    }
  }

  return {
    data: {
      message:
        paymentMethod === "cash"
          ? "Cash order created."
          : "Bank transfer order created.",
      orderId,
      orderNumber,
      paymentStatus: getCheckoutPaymentStatus(paymentMethod),
      status: "pending_payment",
      total,
    },
    ok: true,
  };
}

export function parseCheckoutOrderItems(
  items: Array<{ sku: string; quantity: number }> | undefined,
  itemsJson?: string,
) {
  if (items?.length) {
    return normalizeCartItems(items);
  }

  if (!itemsJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(itemsJson);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return normalizeCartItems(
      parsed.map((item) => ({
        sku: String(item.sku ?? ""),
        quantity: Number(item.quantity ?? 0),
      })),
    );
  } catch {
    return [];
  }
}

function checkoutOrderError(
  code: string,
  message: string,
  status: number,
): CheckoutOrderFailure {
  return {
    error: {
      code,
      message,
    },
    ok: false,
    status,
  };
}

function normalizeLocale(locale: string): Locale {
  return isLocale(locale) ? locale : "it";
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
