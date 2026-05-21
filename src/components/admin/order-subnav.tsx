import { AdminTabs } from "@/components/admin/admin-ui";
import { type Locale, localizePath } from "@/lib/i18n";

type OrderSubnavKey = "overview" | "payments" | "fulfillment" | "timeline";

export function OrderSubnav({
  active,
  counts,
  locale,
}: Readonly<{
  active: OrderSubnavKey;
  counts?: Partial<Record<OrderSubnavKey, number>>;
  locale: Locale;
}>) {
  const labels = {
    overview: locale === "it" ? "Ordini" : "订单总览",
    payments: locale === "it" ? "Pagamenti" : "付款处理",
    fulfillment: locale === "it" ? "Fulfilment" : "履约处理",
    timeline: locale === "it" ? "Timeline" : "时间线",
  };

  return (
    <AdminTabs
      wrap
      items={[
        {
          href: localizePath(locale, "/admin/orders"),
          label: labels.overview,
          active: active === "overview",
          count: counts?.overview,
        },
        {
          href: localizePath(locale, "/admin/orders/payments"),
          label: labels.payments,
          active: active === "payments",
          count: counts?.payments,
        },
        {
          href: localizePath(locale, "/admin/orders/fulfillment"),
          label: labels.fulfillment,
          active: active === "fulfillment",
          count: counts?.fulfillment,
        },
        {
          href: localizePath(locale, "/admin/orders/timeline"),
          label: labels.timeline,
          active: active === "timeline",
          count: counts?.timeline,
        },
      ]}
    />
  );
}
