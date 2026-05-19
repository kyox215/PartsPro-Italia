import { getAuthContext } from "@/lib/auth";
import { products } from "@/lib/catalog";
import type { Locale } from "@/lib/i18n";
import { calculateLineTotal } from "@/lib/pricing";
import {
  getSupabaseServerClient,
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";

export type CheckoutLine = {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  subtotal: number;
  vat: number;
  total: number;
  availableStock: number;
  incomingAvailable: number;
  fulfillmentType: "stock" | "preorder" | "mixed";
  preorderLeadTimeMinDays: number;
  preorderLeadTimeMaxDays: number;
};

export type CheckoutLinesResult = {
  lines: CheckoutLine[];
  requiresLogin: boolean;
  isSupabaseBacked: boolean;
};

type CheckoutCatalogRow = {
  sku: string;
  name_it: string;
  name_zh: string;
  b2b_price: number | string | null;
  available_stock: number | null;
  incoming_qty: number | null;
  incoming_available: number | null;
  preorder_lead_time_min_days: number | null;
  preorder_lead_time_max_days: number | null;
};

export async function loadCheckoutLines({
  locale,
  items,
}: Readonly<{
  locale: Locale;
  items: Array<{ sku: string; quantity: number }>;
}>): Promise<CheckoutLinesResult> {
  const auth = await getAuthContext();

  if (hasSupabasePublicConfig()) {
    if (!auth.user) {
      return { lines: [], requiresLogin: true, isSupabaseBacked: true };
    }

    const supabase = await getSupabaseServerClient();
    const skus = items.map((item) => item.sku);
    const { data, error } = await supabase
      .from("catalog_private_items")
      .select("*")
      .in("sku", skus);

    if (!error && data) {
      const rows = data as unknown as CheckoutCatalogRow[];
      return {
        lines: items.flatMap((item) => {
          const row = rows.find((candidate) => candidate.sku === item.sku);
          if (!row) return [];

          const unitPrice = Number(row.b2b_price ?? 0);
          const vatRate = 0.22;
          const subtotal = unitPrice * item.quantity;
          const vat = subtotal * vatRate;
          const availableStock = Number(row.available_stock ?? 0);
          const incomingAvailable = Number(row.incoming_available ?? row.incoming_qty ?? 0);

          return [
            {
              sku: row.sku,
              name: locale === "it" ? row.name_it : row.name_zh,
              quantity: item.quantity,
              unitPrice,
              vatRate,
              subtotal,
              vat,
              total: subtotal + vat,
              availableStock,
              incomingAvailable,
              fulfillmentType: getFulfillmentType(
                item.quantity,
                availableStock,
                incomingAvailable,
              ),
              preorderLeadTimeMinDays: Number(row.preorder_lead_time_min_days ?? 7),
              preorderLeadTimeMaxDays: Number(row.preorder_lead_time_max_days ?? 14),
            },
          ];
        }),
        requiresLogin: false,
        isSupabaseBacked: true,
      };
    }
  }

  const fallbackItems = items.length
    ? items
    : [
        { sku: products[0].sku, quantity: 5 },
        { sku: products[1].sku, quantity: 10 },
      ];

  return {
    lines: fallbackItems.flatMap((item) => {
      const product = products.find((candidate) => candidate.sku === item.sku);
      if (!product) return [];
      const totals = calculateLineTotal(product, item.quantity, true);
      return [
        {
          sku: product.sku,
          name: product.names[locale],
          quantity: item.quantity,
          unitPrice: totals.unitPrice,
          vatRate: product.vatRate,
          subtotal: totals.subtotal,
          vat: totals.vat,
          total: totals.subtotal + totals.vat,
          availableStock: product.stock,
          incomingAvailable: product.incoming ?? 0,
          fulfillmentType: getFulfillmentType(
            item.quantity,
            product.stock,
            product.incoming ?? 0,
          ),
          preorderLeadTimeMinDays: 7,
          preorderLeadTimeMaxDays: 14,
        },
      ];
    }),
    requiresLogin: false,
    isSupabaseBacked: false,
  };
}

export function getFulfillmentType(
  quantity: number,
  availableStock: number,
  incomingAvailable: number,
): "stock" | "preorder" | "mixed" {
  if (quantity <= availableStock) return "stock";
  if (availableStock <= 0 && quantity <= incomingAvailable) return "preorder";
  return "mixed";
}
