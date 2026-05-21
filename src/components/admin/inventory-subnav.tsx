import { AdminTabs } from "@/components/admin/admin-ui";
import { type Locale, localizePath } from "@/lib/i18n";

export function InventorySubnav({
  active,
  locale,
  counts,
}: Readonly<{
  active: "overview" | "import" | "incoming" | "movements";
  locale: Locale;
  counts?: Partial<Record<"import" | "incoming" | "movements", number>>;
}>) {
  const labels = {
    overview: locale === "it" ? "Inventario" : "库存总览",
    import: locale === "it" ? "Import prearrivi" : "预到货导入",
    incoming: locale === "it" ? "Arrivi / ammanchi" : "到货 / 缺货",
    movements: locale === "it" ? "Movimenti" : "库存流水",
  };

  return (
    <AdminTabs
      wrap
      items={[
        {
          href: localizePath(locale, "/admin/inventory"),
          label: labels.overview,
          active: active === "overview",
        },
        {
          href: localizePath(locale, "/admin/inventory/import"),
          label: labels.import,
          active: active === "import",
          count: counts?.import,
        },
        {
          href: localizePath(locale, "/admin/inventory/incoming"),
          label: labels.incoming,
          active: active === "incoming",
          count: counts?.incoming,
        },
        {
          href: localizePath(locale, "/admin/inventory/movements"),
          label: labels.movements,
          active: active === "movements",
          count: counts?.movements,
        },
      ]}
    />
  );
}
