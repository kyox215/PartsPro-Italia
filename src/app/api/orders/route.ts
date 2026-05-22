import { NextResponse } from "next/server";
import { createCheckoutOrder } from "@/admin/services/order-checkout";
import { checkoutCartCookieName } from "@/lib/checkout-cart-cookie";
import { parseRequestBody } from "@/lib/request";
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

  const result = await createCheckoutOrder(parsed.data);

  if (!result.ok) {
    return orderError({
      request,
      locale: parsed.data.locale,
      message: result.error.message,
      missingFields: result.error.missingFields,
      status: result.status,
      type: result.error.code === "COMPANY_PROFILE_REQUIRED" ? "company" : "checkout",
    });
  }

  if (wantsRedirect(request) && result.data.status === "checkout_created" && result.data.checkoutUrl) {
    const response = NextResponse.redirect(result.data.checkoutUrl, 303);
    response.cookies.delete(checkoutCartCookieName);
    return response;
  }

  if (wantsRedirect(request)) {
    const accountUrl = new URL(
      `/${parsed.data.locale}/account/orders/${encodeURIComponent(result.data.orderNumber)}`,
      request.url,
    );
    accountUrl.searchParams.set("status", result.data.paymentStatus);
    const response = NextResponse.redirect(accountUrl, 303);
    response.cookies.delete(checkoutCartCookieName);
    return response;
  }

  const response = NextResponse.json(result.data);
  response.cookies.delete(checkoutCartCookieName);
  return response;
}

function wantsRedirect(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const accept = request.headers.get("accept") ?? "";
  return contentType.includes("application/x-www-form-urlencoded") || accept.includes("text/html");
}

function orderError({
  request,
  locale,
  message,
  missingFields,
  status,
  type,
}: {
  request: Request;
  locale: string;
  message: string;
  missingFields?: string[];
  status: number;
  type: "checkout" | "company";
}) {
  if (wantsRedirect(request)) {
    const url =
      type === "company"
        ? new URL(`/${locale}/account/company`, request.url)
        : new URL(`/${locale}/checkout`, request.url);

    if (type === "company") {
      url.searchParams.set("next", `/${locale}/checkout`);
      url.searchParams.set("error", "company-required");
    } else {
      url.searchParams.set("error", message);
    }

    return NextResponse.redirect(url, 303);
  }

  return NextResponse.json(
    {
      error: message,
      ...(missingFields ? { missingFields } : {}),
    },
    { status },
  );
}
