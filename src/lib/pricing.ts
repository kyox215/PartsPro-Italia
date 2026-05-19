import type { Locale } from "@/lib/i18n";
import type { Product } from "@/lib/catalog";

export function formatMoney(amount: number, locale: Locale = "it") {
  return new Intl.NumberFormat(locale === "it" ? "it-IT" : "zh-CN", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function getB2BUnitPrice(product: Product, quantity: number) {
  const matchedTier = [...product.tiers]
    .sort((a, b) => b.minQty - a.minQty)
    .find((tier) => quantity >= tier.minQty);

  return matchedTier?.unitPrice ?? product.b2bPrice;
}

export function calculateLineTotal(product: Product, quantity: number, isB2B = false) {
  const unitPrice = isB2B ? getB2BUnitPrice(product, quantity) : product.retailPrice;
  return {
    unitPrice,
    subtotal: unitPrice * quantity,
    vat: unitPrice * quantity * product.vatRate,
    total: unitPrice * quantity * (1 + product.vatRate),
  };
}
