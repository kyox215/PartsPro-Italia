import { Activity, Truck } from "lucide-react";
import {
  AdminDataTable,
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  StatusPill,
} from "@/components/admin/admin-ui";
import { InventorySubnav } from "@/components/admin/inventory-subnav";
import { getAdminInventoryMovements, getOpenSupplierPurchaseItems, getSupplierPurchaseOrders } from "@/lib/admin-inventory";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale } from "@/lib/i18n";

export default async function AdminInventoryMovementsPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const auth = await getAuthContext();
  const canLoad = !auth.configured || auth.isAdmin;
  const [orders, openItems, movements] = canLoad
    ? await Promise.all([
        getSupplierPurchaseOrders(),
        getOpenSupplierPurchaseItems(),
        getAdminInventoryMovements(160),
      ])
    : [[], [], []];

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Inventory ledger" : "库存流水"}
        title={locale === "it" ? "Movimenti inventario" : "库存流水记录"}
        description={
          locale === "it"
            ? "Traccia import, ricezioni, ammanchi, rettifiche e prenotazioni."
            : "集中查看导入、到货、缺货、手动调整和订单锁库等流水。"
        }
      />

      <InventorySubnav
        active="movements"
        counts={{ import: orders.length, incoming: openItems.length, movements: movements.length }}
        locale={locale}
      />

      <section className="grid gap-2 sm:grid-cols-3">
        <AdminMetricCard icon={Activity} label={locale === "it" ? "Movimenti" : "流水数量"} value={movements.length} tone="blue" />
        <AdminMetricCard icon={Truck} label={locale === "it" ? "Ricezioni" : "到货流水"} value={movements.filter((movement) => movement.movementType === "receive_stock").length} tone="green" />
        <AdminMetricCard icon={Activity} label={locale === "it" ? "Ammanchi" : "缺货流水"} value={movements.filter((movement) => movement.movementType === "mark_shortage").length} tone="amber" />
      </section>

      <AdminPanel title={locale === "it" ? "Ledger" : "流水明细"}>
        {movements.length ? (
          <AdminDataTable
            minWidth={900}
            mobileCards={<InventoryMovementCards movements={movements} locale={locale} />}
          >
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-stone-400">
                <tr className="border-b border-black/5">
                  <th className="px-2.5 py-2">SKU</th>
                  <th className="px-2.5 py-2">{locale === "it" ? "Tipo" : "类型"}</th>
                  <th className="px-2.5 py-2">Qty</th>
                  <th className="px-2.5 py-2">Stock Δ</th>
                  <th className="px-2.5 py-2">Incoming Δ</th>
                  <th className="px-2.5 py-2">{locale === "it" ? "Nota" : "备注"}</th>
                  <th className="px-2.5 py-2">{locale === "it" ? "Ora" : "时间"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-stone-50">
                    <td className="px-2.5 py-2.5 font-mono text-xs font-black text-stone-900">{movement.sku}</td>
                    <td className="px-2.5 py-2.5"><StatusPill status={movement.movementType} tone="slate" /></td>
                    <td className="px-2.5 py-2.5 font-black">{movement.quantity}</td>
                    <td className="px-2.5 py-2.5">{movement.stockDelta}</td>
                    <td className="px-2.5 py-2.5">{movement.incomingDelta}</td>
                    <td className="px-2.5 py-2.5 text-xs font-semibold text-stone-600">{movement.note ?? "-"}</td>
                    <td className="px-2.5 py-2.5 text-xs text-stone-500">{new Date(movement.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminDataTable>
        ) : (
          <AdminEmptyState
            icon={Activity}
            title={locale === "it" ? "Nessun movimento" : "暂无库存流水"}
            description={locale === "it" ? "Import, ricezioni e rettifiche appariranno qui." : "导入、到货和手动调整会显示在这里。"}
          />
        )}
      </AdminPanel>
    </div>
  );
}

function InventoryMovementCards({
  movements,
  locale,
}: Readonly<{
  movements: Awaited<ReturnType<typeof getAdminInventoryMovements>>;
  locale: Locale;
}>) {
  return (
    <div className="grid gap-2">
      {movements.map((movement) => (
        <article key={movement.id} className="rounded-lg border border-black/5 bg-stone-50 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="break-all font-mono text-xs font-black text-stone-900">{movement.sku}</p>
            <StatusPill status={movement.movementType} tone="slate" />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <MetricMini label="Qty" value={movement.quantity} />
            <MetricMini label="Stock" value={movement.stockDelta} />
            <MetricMini label="Incoming" value={movement.incomingDelta} />
          </div>
          {movement.note ? (
            <p className="mt-2 break-words text-xs font-semibold text-stone-600">{movement.note}</p>
          ) : null}
          <p className="mt-2 text-xs font-semibold text-stone-500">
            {new Date(movement.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}
          </p>
        </article>
      ))}
    </div>
  );
}

function MetricMini({ label, value }: Readonly<{ label: string; value: number | string }>) {
  return (
    <div className="min-w-0 rounded-md bg-white px-2 py-1.5">
      <p className="truncate text-[11px] font-black uppercase text-stone-400">{label}</p>
      <p className="mt-0.5 truncate font-black text-stone-950">{value}</p>
    </div>
  );
}
