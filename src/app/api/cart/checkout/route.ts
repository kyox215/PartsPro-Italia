import { NextResponse } from "next/server";
import { checkoutCartSchema } from "@/admin/schemas/order-checkout";
import { prepareCheckoutCart } from "@/admin/services/order-checkout";
import { checkoutCartCookieName, encodeCheckoutCart } from "@/lib/checkout-cart-cookie";
import { parseRequestBody } from "@/lib/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await parseRequestBody(request);
  const parsed = checkoutCartSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid checkout cart", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const prepared = prepareCheckoutCart(parsed.data);

  if (!prepared.ok) {
    return NextResponse.json(
      { error: prepared.error.message },
      { status: prepared.status },
    );
  }

  const response = NextResponse.json({ redirectTo: prepared.data.redirectTo });
  const secure = new URL(request.url).protocol === "https:";

  response.cookies.set(checkoutCartCookieName, encodeCheckoutCart(prepared.data.items), {
    httpOnly: true,
    maxAge: 60 * 30,
    path: "/",
    sameSite: "lax",
    secure,
  });

  return response;
}
