import { NextResponse } from "next/server";
import { getAdminCustomerRows } from "@/lib/admin-customers";
import { getAdminOrderRows } from "@/lib/admin-operations";
import { getAdminProductRows } from "@/lib/admin-products";
import { assertAdminAccess } from "@/lib/auth";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { displayOrderNumber, orderRouteId } from "@/lib/order-number";

export const runtime = "nodejs";

type SearchResult = {
  type: "customer" | "order" | "product";
  label: string;
  description: string;
  href: string;
};

export async function GET(request: Request) {
  const admin = await assertAdminAccess();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const url = new URL(request.url);
  const q = normalize(url.searchParams.get("q") ?? "");
  const rawLocale = url.searchParams.get("locale") ?? "zh";
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "zh";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [customers, orders, products] = await Promise.all([
    getAdminCustomerRows(),
    getAdminOrderRows(),
    getAdminProductRows(),
  ]);

  const results: SearchResult[] = [
    ...customers
      .filter((customer) =>
        matches(q, [
          customer.companyName,
          customer.contactName,
          customer.email,
          customer.phone,
          customer.whatsapp,
          customer.vatNumber,
        ]),
      )
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 6)
      .map((customer) => ({
        type: "customer" as const,
        label: customer.companyName,
        description: [
          customer.contactName,
          customer.phone,
          customer.whatsapp,
          customer.email,
          `${locale === "it" ? "Spesa" : "成交"} ${customer.totalSpent.toFixed(2)}`,
        ]
          .filter(Boolean)
          .join(" / "),
        href: localizePath(locale, `/admin/accounts/customers/${customer.id}`),
      })),
    ...orders
      .filter((order) =>
        matches(q, [
          order.id,
          order.orderNumber,
          order.companyName,
          order.customerName,
          order.email,
          order.trackingNumber,
        ]),
      )
      .slice(0, 4)
      .map((order) => ({
        type: "order" as const,
        label: displayOrderNumber(order, locale),
        description: [order.companyName || order.customerName, order.email, order.status]
          .filter(Boolean)
          .join(" / "),
        href: localizePath(locale, `/admin/orders/${orderRouteId(order)}`),
      })),
    ...products
      .filter((product) =>
        matches(q, [
          product.sku,
          product.barcodeEan13,
          product.brand,
          product.model,
          product.nameIt,
          product.nameZh,
        ]),
      )
      .slice(0, 4)
      .map((product) => ({
        type: "product" as const,
        label: product.sku,
        description: [product.brand, product.model, locale === "it" ? product.nameIt : product.nameZh]
          .filter(Boolean)
          .join(" / "),
        href: localizePath(locale, `/admin/products/${product.skuId}`),
      })),
  ];

  return NextResponse.json({ results });
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function matches(query: string, values: Array<string | null | undefined>) {
  return values.some((value) => normalize(String(value ?? "")).includes(query));
}
