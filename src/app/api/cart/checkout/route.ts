import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeCartItems } from "@/lib/cart-quote";
import { checkoutCartCookieName, encodeCheckoutCart } from "@/lib/checkout-cart-cookie";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { parseRequestBody } from "@/lib/request";

export const runtime = "nodejs";

const checkoutCartSchema = z.object({
  locale: z.enum(["it", "zh"]).default("it"),
  items: z
    .array(
      z.object({
        sku: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .default([]),
});

export async function POST(request: Request) {
  const body = await parseRequestBody(request);
  const parsed = checkoutCartSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid checkout cart", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const locale: Locale = isLocale(parsed.data.locale) ? parsed.data.locale : "it";
  const items = normalizeCartItems(parsed.data.items);

  if (items.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  const redirectTo = localizePath(locale, "/checkout");
  const response = NextResponse.json({ redirectTo });
  const secure = new URL(request.url).protocol === "https:";

  response.cookies.set(checkoutCartCookieName, encodeCheckoutCart(items), {
    httpOnly: true,
    maxAge: 60 * 30,
    path: "/",
    sameSite: "lax",
    secure,
  });

  return response;
}
