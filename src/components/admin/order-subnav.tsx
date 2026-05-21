import { AdminTabs } from "@/components/admin/admin-ui";
import { type Locale, localizePath } from "@/lib/i18n";

type OrderSubnavKey = "overview" | "timeline";

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
          href: localizePath(locale, "/admin/orders/timeline"),
          label: labels.timeline,
          active: active === "timeline",
          count: counts?.timeline,
        },
      ]}
    />
  );
}
