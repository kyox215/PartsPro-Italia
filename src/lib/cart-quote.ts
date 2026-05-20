import { canViewB2BPrice, getAuthContext } from "@/lib/auth";
import { products } from "@/lib/catalog";
import type { Locale } from "@/lib/i18n";
import { calculateLineTotal } from "@/lib/pricing";
import {
  getSupabaseServerClient,
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";

export type CartInputItem = {
  sku: string;
  quantity: number;
};

export type CartQuoteLine = {
  sku: string;
  slug: string | null;
  name: string;
  quantity: number;
  moq: number;
  unitPrice: number | null;
  subtotal: number | null;
  vat: number | null;
  total: number | null;
  availableStock: number | null;
  incomingAvailable: number | null;
  fulfillmentType: "stock" | "preorder" | "mixed" | "unknown";
  preorderLeadTimeMinDays: number;
  preorderLeadTimeMaxDays: number;
  canOrder: boolean;
  errors: string[];
};

export type CartQuoteResult = {
  lines: CartQuoteLine[];
  missingSkus: string[];
  subtotal: number;
  vat: number;
  total: number;
  requiresLogin: boolean;
  isPriceVisible: boolean;
  isB2BPriceVisible: boolean;
  isSupabaseBacked: boolean;
};

type CartCatalogRow = {
  slug: string;
  sku: string;
  name_it: string;
  name_zh: string;
  moq: number | null;
  retail_price?: number | string | null;
  b2b_price?: number | string | null;
  vat_rate?: number | string | null;
  available_stock?: number | null;
  incoming_available?: number | null;
  incoming_qty?: number | null;
  preorder_lead_time_min_days?: number | null;
  preorder_lead_time_max_days?: number | null;
};

export function normalizeCartItems(items: CartInputItem[]) {
  const merged = new Map<string, number>();

  items.forEach((item) => {
    const sku = item.sku.trim();
    const quantity = Math.max(0, Math.floor(Number(item.quantity) || 0));
    if (!sku || quantity <= 0) return;
    merged.set(sku, Math.min((merged.get(sku) ?? 0) + quantity, 99999));
  });

  return [...merged.entries()].map(([sku, quantity]) => ({ sku, quantity }));
}

export async function loadCartQuote({
  locale,
  items,
  requireLogin = false,
}: Readonly<{
  locale: Locale;
  items: CartInputItem[];
  requireLogin?: boolean;
}>): Promise<CartQuoteResult> {
  const normalizedItems = normalizeCartItems(items);
  const auth = await getAuthContext();
  const isB2BPriceVisible = canViewB2BPrice(auth);
  const isPriceVisible = Boolean(auth.user) || !auth.configured;

  if (normalizedItems.length === 0) {
    return emptyQuote({
      requiresLogin: false,
      isPriceVisible,
      isB2BPriceVisible,
      isSupabaseBacked: hasSupabasePublicConfig(),
    });
  }

  if (requireLogin && auth.configured && !auth.user) {
    return emptyQuote({
      requiresLogin: true,
      isPriceVisible: false,
      isB2BPriceVisible: false,
      isSupabaseBacked: hasSupabasePublicConfig(),
    });
  }

  if (hasSupabasePublicConfig()) {
    const supabase = await getSupabaseServerClient();
    const viewName = auth.user ? "catalog_private_items" : "catalog_public_items";
    const { data, error } = await supabase
      .from(viewName)
      .select("*")
      .in(
        "sku",
        normalizedItems.map((item) => item.sku),
      );

    if (!error && data) {
      return summarizeQuote(
        normalizedItems.map((item) => {
          const row = (data as CartCatalogRow[]).find(
            (candidate) => candidate.sku === item.sku,
          );
          return row
            ? mapSupabaseQuoteLine(row, item.quantity, locale, isPriceVisible, isB2BPriceVisible)
            : null;
        }),
        normalizedItems,
        {
          requiresLogin: false,
          isPriceVisible,
          isB2BPriceVisible,
          isSupabaseBacked: true,
        },
      );
    }
  }

  return summarizeQuote(
    normalizedItems.map((item) => {
      const product = products.find((candidate) => candidate.sku === item.sku);
      if (!product) return null;
      const totals = calculateLineTotal(product, item.quantity, isB2BPriceVisible);
      const availableStock = product.stock;
      const incomingAvailable = product.incoming ?? 0;
      const errors = buildLineErrors({
        sku: item.sku,
        quantity: item.quantity,
        moq: product.moq,
        availableStock,
        incomingAvailable,
        isPriceVisible,
      });

      return {
        sku: product.sku,
        slug: product.slug,
        name: product.names[locale],
        quantity: item.quantity,
        moq: product.moq,
        unitPrice: isPriceVisible ? totals.unitPrice : null,
        subtotal: isPriceVisible ? totals.subtotal : null,
        vat: isPriceVisible ? totals.vat : null,
        total: isPriceVisible ? totals.total : null,
        availableStock: isPriceVisible ? availableStock : null,
        incomingAvailable: isPriceVisible ? incomingAvailable : null,
        fulfillmentType: isPriceVisible
          ? getFulfillmentType(item.quantity, availableStock, incomingAvailable)
          : "unknown",
        preorderLeadTimeMinDays: 7,
        preorderLeadTimeMaxDays: 14,
        canOrder: errors.length === 0,
        errors,
      };
    }),
    normalizedItems,
    {
      requiresLogin: false,
      isPriceVisible,
      isB2BPriceVisible,
      isSupabaseBacked: false,
    },
  );
}

function mapSupabaseQuoteLine(
  row: CartCatalogRow,
  quantity: number,
  locale: Locale,
  isPriceVisible: boolean,
  isB2BPriceVisible: boolean,
): CartQuoteLine {
  const moq = Number(row.moq ?? 1);
  const availableStock = Number(row.available_stock ?? 0);
  const incomingAvailable = Number(row.incoming_available ?? row.incoming_qty ?? 0);
  const unitPrice = Number(
    isB2BPriceVisible ? row.b2b_price ?? 0 : row.retail_price ?? 0,
  );
  const vatRate = Number(row.vat_rate ?? 0.22);
  const subtotal = unitPrice * quantity;
  const vat = subtotal * vatRate;
  const errors = buildLineErrors({
    sku: row.sku,
    quantity,
    moq,
    availableStock,
    incomingAvailable,
    isPriceVisible,
  });

  return {
    sku: row.sku,
    slug: row.slug,
    name: locale === "it" ? row.name_it : row.name_zh,
    quantity,
    moq,
    unitPrice: isPriceVisible ? unitPrice : null,
    subtotal: isPriceVisible ? subtotal : null,
    vat: isPriceVisible ? vat : null,
    total: isPriceVisible ? subtotal + vat : null,
    availableStock: isPriceVisible ? availableStock : null,
    incomingAvailable: isPriceVisible ? incomingAvailable : null,
    fulfillmentType: isPriceVisible
      ? getFulfillmentType(quantity, availableStock, incomingAvailable)
      : "unknown",
    preorderLeadTimeMinDays: Number(row.preorder_lead_time_min_days ?? 7),
    preorderLeadTimeMaxDays: Number(row.preorder_lead_time_max_days ?? 14),
    canOrder: errors.length === 0,
    errors,
  };
}

function summarizeQuote(
  rawLines: Array<CartQuoteLine | null>,
  items: CartInputItem[],
  meta: Pick<
    CartQuoteResult,
    "requiresLogin" | "isPriceVisible" | "isB2BPriceVisible" | "isSupabaseBacked"
  >,
): CartQuoteResult {
  const lines = rawLines.filter((line): line is CartQuoteLine => Boolean(line));
  const found = new Set(lines.map((line) => line.sku));
  const subtotal = lines.reduce((sum, line) => sum + (line.subtotal ?? 0), 0);
  const vat = lines.reduce((sum, line) => sum + (line.vat ?? 0), 0);

  return {
    ...meta,
    lines,
    missingSkus: items.map((item) => item.sku).filter((sku) => !found.has(sku)),
    subtotal,
    vat,
    total: subtotal + vat,
  };
}

function emptyQuote(
  meta: Pick<
    CartQuoteResult,
    "requiresLogin" | "isPriceVisible" | "isB2BPriceVisible" | "isSupabaseBacked"
  >,
): CartQuoteResult {
  return {
    ...meta,
    lines: [],
    missingSkus: [],
    subtotal: 0,
    vat: 0,
    total: 0,
  };
}

function buildLineErrors({
  sku,
  quantity,
  moq,
  availableStock,
  incomingAvailable,
  isPriceVisible,
}: {
  sku: string;
  quantity: number;
  moq: number;
  availableStock: number;
  incomingAvailable: number;
  isPriceVisible: boolean;
}) {
  if (!isPriceVisible) return [];

  const errors: string[] = [];
  if (quantity < moq) {
    errors.push(`SKU ${sku} requires MOQ ${moq}`);
  }

  if (quantity > availableStock + incomingAvailable) {
    errors.push(`SKU ${sku} has only ${availableStock + incomingAvailable} available/preorder units`);
  }

  return errors;
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
