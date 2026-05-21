import { CheckCircle2, PackageCheck, Truck } from "lucide-react";
import { AdminCsrfField } from "@/components/admin/admin-csrf-field";
import {
  AdminButtonLink,
  AdminEmptyState,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  StatusPill,
} from "@/components/admin/admin-ui";
import { InventoryMissingControls } from "@/components/admin/inventory-missing-controls";
import { InventorySubnav } from "@/components/admin/inventory-subnav";
import { getOpenSupplierPurchaseItems, getSupplierPurchaseOrders } from "@/lib/admin-inventory";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

export default async function AdminInventoryIncomingPage({
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
  const [orders, allOpenItems] = canLoad
    ? await Promise.all([getSupplierPurchaseOrders(), getOpenSupplierPurchaseItems()])
    : [[], []];
  const selectedOrderId = valueOf(query.po) ?? orders.find((order) => order.remainingTotal > 0)?.id ?? orders[0]?.id ?? "";
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;
  const items = selectedOrderId && canLoad ? await getOpenSupplierPurchaseItems(selectedOrderId) : [];
  const itemIds = items.map((item) => item.id).join(",");
  const remainingQty = items.reduce((sum, item) => sum + item.remainingQty, 0);
  const received = valueOf(query.received);
  const missing = valueOf(query.missing);
  const processed = valueOf(query.processed);
  const error = valueOf(query.error);

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Receiving workflow" : "到货工作流"}
        title={locale === "it" ? "Conferma arrivi e ammanchi" : "到货确认 / 缺货处理"}
        description={
          locale === "it"
            ? "Scegli un batch, marca solo le righe mancanti: il resto entra automaticamente a stock."
            : "选择导入批次，只标记未到或少到的商品；未标记的行会自动按全部到货入库。"
        }
        actions={
          <AdminButtonLink href={localizePath(locale, "/admin/inventory/import")} variant="secondary">
            {locale === "it" ? "Import batch" : "导入批次"}
          </AdminButtonLink>
        }
      />

      <InventorySubnav
        active="incoming"
        counts={{ import: orders.length, incoming: allOpenItems.length }}
        locale={locale}
      />

      {error ? <AdminNotice tone="danger">{decodeURIComponent(error)}</AdminNotice> : null}
      {received || missing ? (
        <AdminNotice tone="success">
          {locale === "it"
            ? `Ricezione aggiornata: ${received || "0"} ricevuti, ${missing || "0"} mancanti, ${processed || "0"} righe elaborate.`
            : `到货已更新：实收 ${received || "0"}，缺货 ${missing || "0"}，处理 ${processed || "0"} 行。`}
        </AdminNotice>
      ) : null}

      <section className="grid gap-2 sm:grid-cols-3">
        <AdminMetricCard icon={Truck} label={locale === "it" ? "Batch aperti" : "待对货批次"} value={orders.filter((order) => order.remainingTotal > 0).length} tone="amber" />
        <AdminMetricCard icon={PackageCheck} label={locale === "it" ? "Righe aperte" : "待确认行"} value={allOpenItems.length} tone="blue" />
        <AdminMetricCard icon={CheckCircle2} label={locale === "it" ? "Quantita batch" : "本批待确认"} value={remainingQty} tone="green" />
      </section>

      <AdminPanel
        title={locale === "it" ? "Scegli batch" : "选择导入批次"}
        description={locale === "it" ? "Ogni batch corrisponde a un Excel importato." : "每个批次对应一次 Excel 导入。"}
      >
        {orders.length ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {orders.map((order) => {
              const active = order.id === selectedOrderId;
              return (
                <a
                  className={[
                    "rounded-lg border p-3 transition",
                    active ? "border-stone-950 bg-stone-950 text-white" : "border-black/5 bg-stone-50 text-stone-950 hover:border-black/20 hover:bg-white",
                  ].join(" ")}
                  href={localizePath(locale, `/admin/inventory/incoming?po=${order.id}`)}
                  key={order.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{order.sourceFilename}</p>
                      <p className={active ? "mt-1 font-mono text-xs font-semibold text-white/60" : "mt-1 font-mono text-xs font-semibold text-stone-500"}>{shortId(order.id)}</p>
                    </div>
                    <StatusPill status={order.remainingTotal > 0 ? (locale === "it" ? "Aperto" : "待确认") : (locale === "it" ? "Chiuso" : "已完成")} tone={order.remainingTotal > 0 ? "amber" : "green"} />
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-1.5 text-xs">
                    <BatchMini label={locale === "it" ? "Ord." : "订"} value={order.orderedTotal} active={active} />
                    <BatchMini label={locale === "it" ? "Ric." : "收"} value={order.receivedTotal} active={active} />
                    <BatchMini label={locale === "it" ? "Miss" : "缺"} value={order.missingTotal} active={active} />
                    <BatchMini label={locale === "it" ? "Open" : "待"} value={order.remainingTotal} active={active} />
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <AdminEmptyState
            icon={Truck}
            title={locale === "it" ? "Nessun batch importato" : "暂无导入批次"}
            description={locale === "it" ? "Importa prima un ordine fornitore." : "请先导入上游订货单。"}
            action={
              <AdminButtonLink href={localizePath(locale, "/admin/inventory/import")}>
                {locale === "it" ? "Importa ora" : "去导入"}
              </AdminButtonLink>
            }
          />
        )}
      </AdminPanel>

      <AdminPanel
        title={locale === "it" ? "Controllo merce" : "对货清单"}
        description={
          selectedOrder
            ? locale === "it"
              ? "Lascia le righe non marcate: verranno ricevute per intero."
              : "不用逐行填写实收。没点的行默认全部到货，只需要点未到或少到。"
            : locale === "it"
              ? "Seleziona un batch da controllare."
              : "请选择一个批次开始对货。"
        }
      >
        {selectedOrder && items.length ? (
          <form action="/api/admin/inventory/receive" method="post">
            <AdminCsrfField />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="purchaseOrderId" value={selectedOrder.id} />
            <input type="hidden" name="itemIds" value={itemIds} />
            <IncomingCheckList items={items} locale={locale} />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-4">
              <p className="text-xs font-semibold leading-5 text-stone-500">
                {locale === "it"
                  ? "Submit riceve automaticamente tutto cio che non hai marcato come mancante."
                  : "点击确认后，未标记缺货的商品会自动按全部到货入库。"}
              </p>
              <button className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700" type="submit">
                {locale === "it" ? "Conferma batch" : "确认本批到货"}
              </button>
            </div>
          </form>
        ) : selectedOrder ? (
          <AdminEmptyState
            icon={PackageCheck}
            title={locale === "it" ? "Batch gia chiuso" : "该批次已完成"}
            description={locale === "it" ? "Non ci sono righe aperte da ricevere." : "没有待确认的商品行。"}
          />
        ) : (
          <AdminEmptyState
            icon={Truck}
            title={locale === "it" ? "Seleziona batch" : "请选择批次"}
            description={locale === "it" ? "I batch importati appariranno sopra." : "导入后的批次会显示在上方。"}
          />
        )}
      </AdminPanel>
    </div>
  );
}

function IncomingCheckList({
  items,
  locale,
}: Readonly<{
  items: Awaited<ReturnType<typeof getOpenSupplierPurchaseItems>>;
  locale: Locale;
}>) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <article
          key={item.id}
          className="grid gap-3 rounded-lg border border-black/5 bg-stone-50 p-3 lg:grid-cols-[190px_minmax(0,1fr)_260px_110px_300px] lg:items-start"
        >
          <div className="min-w-0">
            <p className="break-all font-mono text-xs font-black text-stone-900">{item.sku}</p>
            <p className="mt-1 break-all font-mono text-xs font-semibold text-stone-500">{item.ean13}</p>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusPill status={`${item.remainingQty} ${locale === "it" ? "aperti" : "待确认"}`} tone="amber" />
              <StatusPill status={item.status} tone="slate" />
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-black leading-5 text-stone-950">{item.originalName}</p>
            <p className="mt-1 truncate text-xs font-semibold text-stone-500">{item.supplierName}</p>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-xs">
            <MetricMini label={locale === "it" ? "Ord." : "订"} value={item.orderedQty} />
            <MetricMini label={locale === "it" ? "Ric." : "已收"} value={item.receivedQty} />
            <MetricMini label={locale === "it" ? "Miss" : "已缺"} value={item.missingQty} />
            <MetricMini label={locale === "it" ? "Open" : "待"} value={item.remainingQty} />
          </div>
          <div className="rounded-md bg-white px-2 py-1.5 text-xs">
            <p className="text-[11px] font-black uppercase text-stone-400">{locale === "it" ? "Costo" : "成本"}</p>
            <p className="mt-0.5 font-black text-stone-950">{formatMoney(item.costPrice, locale)}</p>
          </div>
          <InventoryMissingControls locale={locale} name={`missing_${item.id}`} remainingQty={item.remainingQty} />
        </article>
      ))}
    </div>
  );
}

function BatchMini({
  active,
  label,
  value,
}: Readonly<{ active: boolean; label: string; value: number | string }>) {
  return (
    <div className={active ? "rounded-md bg-white/10 px-2 py-1" : "rounded-md bg-white px-2 py-1"}>
      <p className={active ? "text-[10px] font-black uppercase text-white/50" : "text-[10px] font-black uppercase text-stone-400"}>{label}</p>
      <p className={active ? "font-black text-white" : "font-black text-stone-950"}>{value}</p>
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
