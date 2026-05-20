import { normalizeCartItems, type CartInputItem } from "@/lib/cart-quote";

export const checkoutCartCookieName = "partspro_checkout_cart";

export function encodeCheckoutCart(items: CartInputItem[]) {
  return encodeURIComponent(JSON.stringify(normalizeCartItems(items)));
}

export function decodeCheckoutCart(value: string | undefined) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return [];
    return normalizeCartItems(
      parsed.map((item) => ({
        sku: String(item?.sku ?? ""),
        quantity: Number(item?.quantity ?? 0),
      })),
    );
  } catch {
    return [];
  }
}
