import { AdminButtonLink, AdminPageHeader, AdminPanel } from "@/components/admin/admin-ui";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AdminOrderSettingsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "zh";

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Order settings" : "订单设置"}
        title={locale === "it" ? "Regole ordine" : "订单操作设置"}
        description={
          locale === "it"
            ? "Il flusso ordine usa stato, pagamento, tracking e timeline."
            : "订单流只保留订单状态、付款、物流和时间线。"
        }
      />
      <AdminPanel title={locale === "it" ? "Timeline" : "订单时间线"}>
        <p className="mb-3 text-sm font-semibold text-slate-500">
          {locale === "it"
            ? "Usa la timeline per controllare incassi, rimborsi, tracking e modifiche stato."
            : "使用时间线查看收款、退款、物流和状态修改记录。"}
        </p>
        <AdminButtonLink href={localizePath(locale, "/admin/orders/timeline")} variant="secondary">
          {locale === "it" ? "Apri timeline" : "打开时间线"}
        </AdminButtonLink>
      </AdminPanel>
    </div>
  );
}
