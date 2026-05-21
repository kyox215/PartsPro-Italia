import { AdminPageHeader, AdminPanel, AdminButtonLink } from "@/components/admin/admin-ui";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AdminInventorySettingsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "zh";

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Inventory settings" : "库存设置"}
        title={locale === "it" ? "Strumenti inventario" : "库存高级工具"}
        description={
          locale === "it"
            ? "Gli strumenti operativi restano nelle pagine inventario dedicate."
            : "库存调整、预到货导入、到货确认和流水仍在库存模块对应页面处理。"
        }
      />
      <div className="grid gap-3 md:grid-cols-3">
        <AdminPanel title={locale === "it" ? "Import prearrivi" : "预到货导入"}>
          <AdminButtonLink href={localizePath(locale, "/admin/inventory/import")} variant="secondary">
            {locale === "it" ? "Apri import" : "打开导入"}
          </AdminButtonLink>
        </AdminPanel>
        <AdminPanel title={locale === "it" ? "Arrivi" : "到货 / 缺货"}>
          <AdminButtonLink href={localizePath(locale, "/admin/inventory/incoming")} variant="secondary">
            {locale === "it" ? "Apri arrivi" : "打开对货"}
          </AdminButtonLink>
        </AdminPanel>
        <AdminPanel title={locale === "it" ? "Movimenti" : "库存流水"}>
          <AdminButtonLink href={localizePath(locale, "/admin/inventory/movements")} variant="secondary">
            {locale === "it" ? "Apri movimenti" : "打开流水"}
          </AdminButtonLink>
        </AdminPanel>
      </div>
    </div>
  );
}
