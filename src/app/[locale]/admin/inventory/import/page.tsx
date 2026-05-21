import { Boxes, FileSpreadsheet, Truck } from "lucide-react";
import { AdminCsrfField } from "@/components/admin/admin-csrf-field";
import {
  AdminButtonLink,
  AdminDataTable,
  AdminEmptyState,
  AdminInput,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  StatusPill,
} from "@/components/admin/admin-ui";
import { InventorySubnav } from "@/components/admin/inventory-subnav";
import { getOpenSupplierPurchaseItems, getSupplierPurchaseOrders } from "@/lib/admin-inventory";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AdminInventoryImportPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale: rawLocale } = await params;
  const query = (await searchParams) ?? {};
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const auth = await getAuthContext();
  const canLoad = !auth.configured || auth.isAdmin;
  const [orders, openItems] = canLoad
    ? await Promise.all([getSupplierPurchaseOrders(), getOpenSupplierPurchaseItems()])
    : [[], []];
  const imported = valueOf(query.imported);
  const processed = valueOf(query.processed);
  const skipped = valueOf(query.skipped);
  const ordered = valueOf(query.ordered);
  const error = valueOf(query.error);
  const purchaseOrderId = valueOf(query.po);

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Supplier prearrival" : "预到货批次"}
        title={locale === "it" ? "Import prearrivi" : "预到货 Excel 导入"}
        description={
          locale === "it"
            ? "Carica il foglio fornitore: crea catalogo, SKU e quantita in arrivo senza aggiornare lo stock fisico."
            : "导入上游订货单：创建商品、SKU 和在途数量，但不直接增加现货。"
        }
        actions={
          <AdminButtonLink href={localizePath(locale, "/admin/inventory/incoming")}>
            {locale === "it" ? "Vai agli arrivi" : "去到货确认"}
          </AdminButtonLink>
        }
      />

      <InventorySubnav
        active="import"
        counts={{ import: orders.length, incoming: openItems.length }}
        locale={locale}
      />

      {error ? <AdminNotice tone="danger">{decodeURIComponent(error)}</AdminNotice> : null}
      {imported ? (
        <AdminNotice tone="success">
          {locale === "it"
            ? `Import completato: ${imported} SKU, ${ordered || "0"} pezzi in arrivo, ${skipped || "0"} righe saltate su ${processed || "0"}.`
            : `导入完成：${imported} 个 SKU，${ordered || "0"} 件在途，${skipped || "0"} 行跳过，共读取 ${processed || "0"} 行。`}
          {purchaseOrderId ? (
            <span className="ml-2">
              <a className="font-black underline" href={localizePath(locale, `/admin/inventory/incoming?po=${purchaseOrderId}`)}>
                {locale === "it" ? "Apri batch" : "打开该批次"}
              </a>
            </span>
          ) : null}
        </AdminNotice>
      ) : null}

      <section className="grid gap-2 sm:grid-cols-3">
        <AdminMetricCard icon={Boxes} label={locale === "it" ? "Batch" : "导入批次"} value={orders.length} tone="green" />
        <AdminMetricCard icon={Truck} label={locale === "it" ? "Righe aperte" : "待确认行"} value={openItems.length} tone="amber" />
        <AdminMetricCard icon={FileSpreadsheet} label={locale === "it" ? "Quantita aperta" : "待确认数量"} value={openItems.reduce((sum, item) => sum + item.remainingQty, 0)} tone="blue" />
      </section>

      <AdminPanel
        title={locale === "it" ? "Carica ordine fornitore" : "导入上游订货单"}
        description={
          locale === "it"
            ? "Usa Excel oppure il percorso locale predefinito. Il batch verra poi controllato nella pagina arrivi."
            : "上传 Excel，或使用默认本地路径。导入后的批次在“到货 / 缺货”页面处理。"
        }
      >
        <form action="/api/admin/inventory/import-cart" encType="multipart/form-data" method="post" className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(260px,1fr)_auto] md:items-end">
          <AdminCsrfField />
          <input type="hidden" name="locale" value={locale} />
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-stone-500">Excel</span>
            <input className="mt-1.5 h-10 w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm font-semibold text-stone-700" name="file" type="file" accept=".xlsx,.xls" />
          </label>
          <AdminInput name="sourcePath" label={locale === "it" ? "Percorso locale fallback" : "本机文件路径 fallback"} defaultValue="/Users/kyox215/Downloads/cart (1).xlsx" />
          <button className="h-10 rounded-lg bg-stone-950 px-4 text-sm font-black text-white transition hover:bg-stone-800" type="submit">
            {locale === "it" ? "Importa" : "导入预到货"}
          </button>
        </form>
      </AdminPanel>

      <AdminPanel title={locale === "it" ? "Batch importati" : "已导入批次"}>
        {orders.length ? (
          <AdminDataTable minWidth={820} mobileCards={<SupplierOrderCards orders={orders} locale={locale} />}>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-stone-400">
                <tr className="border-b border-black/5">
                  <th className="px-2.5 py-2">File</th>
                  <th className="px-2.5 py-2">Status</th>
                  <th className="px-2.5 py-2">{locale === "it" ? "Ordinato" : "订购"}</th>
                  <th className="px-2.5 py-2">{locale === "it" ? "Ricevuto" : "实收"}</th>
                  <th className="px-2.5 py-2">{locale === "it" ? "Mancante" : "缺货"}</th>
                  <th className="px-2.5 py-2">{locale === "it" ? "Aperto" : "待确认"}</th>
                  <th className="px-2.5 py-2">{locale === "it" ? "Creato" : "创建时间"}</th>
                  <th className="px-2.5 py-2">{locale === "it" ? "Azione" : "操作"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50">
                    <td className="px-2.5 py-2.5">
                      <p className="font-black text-stone-950">{order.sourceFilename}</p>
                      <p className="mt-1 font-mono text-xs font-semibold text-stone-500">{shortId(order.id)}</p>
                    </td>
                    <td className="px-2.5 py-2.5"><StatusPill status={order.status} /></td>
                    <td className="px-2.5 py-2.5">{order.orderedTotal}</td>
                    <td className="px-2.5 py-2.5">{order.receivedTotal}</td>
                    <td className="px-2.5 py-2.5">{order.missingTotal}</td>
                    <td className="px-2.5 py-2.5 font-black">{order.remainingTotal}</td>
                    <td className="px-2.5 py-2.5 text-xs text-stone-500">{new Date(order.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}</td>
                    <td className="px-2.5 py-2.5">
                      <AdminButtonLink href={localizePath(locale, `/admin/inventory/incoming?po=${order.id}`)} variant="secondary">
                        {locale === "it" ? "Controlla" : "对货"}
                      </AdminButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminDataTable>
        ) : (
          <AdminEmptyState
            icon={FileSpreadsheet}
            title={locale === "it" ? "Nessun batch" : "暂无导入批次"}
            description={locale === "it" ? "Importa un ordine fornitore per iniziare." : "导入上游订货单后会显示批次。"}
          />
        )}
      </AdminPanel>
    </div>
  );
}

function SupplierOrderCards({
  orders,
  locale,
}: Readonly<{
  orders: Awaited<ReturnType<typeof getSupplierPurchaseOrders>>;
  locale: Locale;
}>) {
  return (
    <div className="grid gap-2">
      {orders.map((order) => (
        <article key={order.id} className="rounded-lg border border-black/5 bg-stone-50 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-stone-950">{order.sourceFilename}</p>
              <p className="mt-1 font-mono text-xs font-semibold text-stone-500">{shortId(order.id)}</p>
            </div>
            <StatusPill status={order.status} />
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
            <MetricMini label={locale === "it" ? "Ord." : "订购"} value={order.orderedTotal} />
            <MetricMini label={locale === "it" ? "Ric." : "实收"} value={order.receivedTotal} />
            <MetricMini label={locale === "it" ? "Miss" : "缺货"} value={order.missingTotal} />
            <MetricMini label={locale === "it" ? "Open" : "待确认"} value={order.remainingTotal} />
          </div>
          <div className="mt-3">
            <AdminButtonLink href={localizePath(locale, `/admin/inventory/incoming?po=${order.id}`)} variant="secondary">
              {locale === "it" ? "Controlla arrivo" : "对货"}
            </AdminButtonLink>
          </div>
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

function shortId(id: string) {
  return id.length > 14 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id;
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
