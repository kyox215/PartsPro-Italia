import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { checkoutCartCookieName, encodeCheckoutCart } from "@/lib/checkout-cart-cookie";
import { loadOwnedOrder } from "@/lib/account-workflow";
import { parseRequestBody } from "@/lib/request";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { accountOrderActionSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = accountOrderActionSchema.safeParse(rawBody);
  const locale = parsed.success ? parsed.data.locale : String(rawBody.locale ?? "it");
  const fallbackUrl = new URL(`/${locale}/account/orders`, request.url);

  if (!parsed.success) {
    fallbackUrl.searchParams.set("error", "invalid_payload");
    return NextResponse.redirect(fallbackUrl, 303);
  }

  const auth = await getAuthContext();
  if (!auth.user) {
    fallbackUrl.searchParams.set("error", "login_required");
    return NextResponse.redirect(fallbackUrl, 303);
  }
  if (!hasSupabaseAdminConfig()) {
    const demoUrl = new URL(`/${locale}/checkout`, request.url);
    demoUrl.searchParams.set("sku", "DCK-APL-IP11-YEL-7438");
    demoUrl.searchParams.set("qty", "1");
    return NextResponse.redirect(demoUrl, 303);
  }

  try {
    const order = await loadOwnedOrder(parsed.data.id, auth.user.id);
    if (!order) throw new Error("Order not found.");
    const items = (order.order_items ?? []).map((item) => ({
      sku: item.sku,
      quantity: Number(item.quantity ?? 0),
    })).filter((item) => item.sku && item.quantity > 0);
    if (!items.length) throw new Error("Order has no reorderable items.");

    const checkoutUrl = new URL(`/${locale}/checkout`, request.url);
    checkoutUrl.searchParams.set("reorder", parsed.data.id);
    const response = NextResponse.redirect(checkoutUrl, 303);
    response.cookies.set(checkoutCartCookieName, encodeCheckoutCart(items), {
      httpOnly: true,
      maxAge: 60 * 30,
      path: "/",
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
    });
    return response;
  } catch (error) {
    fallbackUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "reorder_failed",
    );
    return NextResponse.redirect(fallbackUrl, 303);
  }
}
