import { AlertTriangle, Boxes, PackageCheck, Search, SlidersHorizontal, Truck } from "lucide-react";
import type { ReactNode } from "react";
import { AdminCsrfField } from "@/components/admin/admin-csrf-field";
import {
  AdminButtonLink,
  AdminCollapsiblePanel,
  AdminEmptyState,
  AdminInput,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  StatusPill,
} from "@/components/admin/admin-ui";
import { InventorySubnav } from "@/components/admin/inventory-subnav";
import type { AdminProductRow } from "@/lib/admin-products";
import {
  getAdminInventoryAlerts,
  getInventorySettings,
  getOpenSupplierPurchaseItems,
  getSupplierPurchaseOrders,
} from "@/lib/admin-inventory";
import { getAdminProductRows } from "@/lib/admin-products";
import { getAuthContext } from "@/lib/auth";
import { categories } from "@/lib/catalog";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

type InventoryFilterState = {
  q: string;
  brand: string;
  model: string;
  category: string;
  status: string;
};

export default async function AdminInventoryPage({
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
  const [settings, orders, openItems, alerts, rows] = canLoad
    ? await Promise.all([
        getInventorySettings(),
        getSupplierPurchaseOrders(),
        getOpenSupplierPurchaseItems(),
        getAdminInventoryAlerts(),
        getAdminProductRows(),
      ])
    : [await getInventorySettings(), [], [], [], []];
  const state: InventoryFilterState = {
    q: valueOf(query.q) ?? "",
    brand: valueOf(query.brand) ?? "",
    model: valueOf(query.model) ?? "",
    category: valueOf(query.category) ?? "",
    status: valueOf(query.status) ?? "all",
  };
  const filteredRows = filterInventoryRows(rows, state);
  const brandOptions = getCountedOptions(rows.map((row) => row.brand));
  const modelOptions = getCountedOptions(
    rows
      .filter((row) => !state.brand || row.brand === state.brand)
      .map((row) => row.model),
  );
  const categoryOptions = getCountedOptions(rows.map((row) => row.category));
  const openQty = openItems.reduce((sum, item) => sum + item.remainingQty, 0);
  const incomingTotal = rows.reduce((sum, row) => sum + row.incomingQty, 0);
  const stockTotal = rows.reduce((sum, row) => sum + row.stockOnHand, 0);

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Inventory workspace" : "库存工作台"}
        title={locale === "it" ? "Inventario prodotti" : "库存总览与商品查询"}
        description={
          locale === "it"
            ? "Cerca SKU, EAN, brand, modello e categoria; gli arrivi fornitore sono in funzioni dedicate."
            : "按商品名、SKU、EAN、品牌、型号和品类查库存；预到货导入和对货放在独立功能里。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin/inventory/import")} variant="secondary">
              {locale === "it" ? "Import prearrivi" : "预到货导入"}
            </AdminButtonLink>
            <AdminButtonLink href={localizePath(locale, "/admin/inventory/incoming")}>
              {locale === "it" ? "Conferma arrivi" : "到货 / 缺货"}
            </AdminButtonLink>
          </>
        }
      />

      <SystemNotice authConfigured={auth.configured} isAdmin={auth.isAdmin} hasUser={Boolean(auth.user)} locale={locale} />
      <Feedback locale={locale} query={query} />
      <InventorySubnav
        active="overview"
        counts={{ import: orders.length, incoming: openItems.length }}
        locale={locale}
      />

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard icon={PackageCheck} label={locale === "it" ? "SKU" : "商品 SKU"} value={rows.length} tone="blue" caption={locale === "it" ? "Catalogo" : "库存目录"} />
        <AdminMetricCard icon={Boxes} label={locale === "it" ? "Stock fisico" : "现货总数"} value={stockTotal} tone="green" caption={locale === "it" ? "Magazzino" : "仓库现货"} />
        <AdminMetricCard icon={Truck} label={locale === "it" ? "In arrivo" : "预到货数量"} value={incomingTotal} tone="amber" caption={`${openItems.length} ${locale === "it" ? "righe aperte" : "行待确认"} / ${openQty}`} />
        <AdminMetricCard icon={AlertTriangle} label={locale === "it" ? "Alert" : "库存预警"} value={alerts.length} tone={alerts.length ? "red" : "green"} caption={locale === "it" ? "Da rivedere" : "需处理"} />
      </section>

      <AdminPanel
        title={locale === "it" ? "Cerca inventario" : "搜索库存商品"}
        toolbar={<StatusPill status={`${filteredRows.length} / ${rows.length} SKU`} tone="blue" />}
      >
        <form
          action={localizePath(locale, "/admin/inventory")}
          className="grid gap-2 lg:grid-cols-[minmax(240px,1fr)_160px_160px_160px_auto] lg:items-end"
          method="get"
        >
          <AdminInput
            defaultValue={state.q}
            label={locale === "it" ? "Cerca tutto" : "全局搜索"}
            name="q"
            placeholder={locale === "it" ? "Nome, SKU, EAN, modello..." : "商品名、SKU、EAN、品牌、型号..."}
            required={false}
          />
          <AdminSelect defaultValue={state.brand} label={locale === "it" ? "Brand" : "品牌"} name="brand">
            <option value="">{locale === "it" ? "Tutti" : "全部品牌"}</option>
            {brandOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.value}</option>
            ))}
          </AdminSelect>
          <AdminSelect defaultValue={state.model} label={locale === "it" ? "Modello" : "型号"} name="model">
            <option value="">{locale === "it" ? "Tutti" : "全部型号"}</option>
            {modelOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.value}</option>
            ))}
          </AdminSelect>
          <AdminSelect defaultValue={state.category} label={locale === "it" ? "Categoria" : "品类"} name="category">
            <option value="">{locale === "it" ? "Tutte" : "全部品类"}</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>{getCategoryLabel(option.value, locale)}</option>
            ))}
          </AdminSelect>
          <input type="hidden" name="status" value={state.status} />
          <button className="h-10 rounded-lg bg-stone-950 px-4 text-sm font-black text-white" type="submit">
            {locale === "it" ? "Cerca" : "搜索"}
          </button>
        </form>
      </AdminPanel>

      <div className="grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)]">
        <AdminPanel
          title={locale === "it" ? "Categorie rapide" : "选择种类"}
          description={locale === "it" ? "Filtri sempre visibili, senza modali." : "像前台一样直接点品牌、型号和品类。"}
          contentClassName="space-y-3"
        >
          <FilterLinkGroup
            current={state.status}
            items={[
              { label: locale === "it" ? "Tutti" : "全部库存", value: "all", count: rows.length },
              { label: locale === "it" ? "Disponibile" : "有现货", value: "in_stock", count: rows.filter((row) => row.stockOnHand - row.stockReserved > 0).length },
              { label: locale === "it" ? "In arrivo" : "有预到货", value: "incoming", count: rows.filter((row) => row.incomingQty - row.incomingReserved > 0).length },
              { label: locale === "it" ? "Stock basso" : "库存低", value: "low_stock", count: rows.filter(isLowStock).length },
              { label: locale === "it" ? "Anomalia" : "异常预留", value: "shortage", count: rows.filter((row) => row.incomingReserved > row.incomingQty || row.stockReserved > row.stockOnHand).length },
            ]}
            label={locale === "it" ? "Stato" : "库存状态"}
            param="status"
            state={state}
            locale={locale}
          />
          <FilterLinkGroup current={state.brand} items={brandOptions} label={locale === "it" ? "Brand" : "品牌"} param="brand" state={state} locale={locale} clearModel />
          <FilterLinkGroup current={state.model} items={modelOptions} label={locale === "it" ? "Modello" : "型号"} param="model" state={state} locale={locale} />
          <FilterLinkGroup current={state.category} items={categoryOptions.map((option) => ({ ...option, label: getCategoryLabel(option.value, locale) }))} label={locale === "it" ? "Categoria" : "品类"} param="category" state={state} locale={locale} />
        </AdminPanel>

        <div className="min-w-0 space-y-3">
          <AdminPanel
            title={locale === "it" ? "Risultati inventario" : "库存商品结果"}
            toolbar={<StatusPill status={`${filteredRows.length} SKU`} />}
          >
            {filteredRows.length ? (
              <div className="grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
                {filteredRows.map((row) => (
                  <InventoryProductCard key={row.skuId} row={row} locale={locale} />
                ))}
              </div>
            ) : (
              <AdminEmptyState
                icon={Search}
                title={locale === "it" ? "Nessuno SKU trovato" : "没有找到 SKU"}
                description={locale === "it" ? "Cambia ricerca o filtri." : "调整搜索或筛选条件。"}
              />
            )}
          </AdminPanel>

          {alerts.length ? (
            <AdminPanel
              title={locale === "it" ? "Alert inventario" : "低库存 / 异常预警"}
              description={locale === "it" ? "SKU sotto soglia o con riserve anomale." : "低于安全库存、补货点或存在异常预留的 SKU。"}
            >
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {alerts.slice(0, 9).map((alert) => (
                  <article key={alert.inventoryId} className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-xs font-black text-stone-900">{alert.sku}</p>
                      <StatusPill status={alert.reason} tone={alert.reason === "oversold" ? "red" : "amber"} />
                    </div>
                    <p className="mt-1 truncate text-sm font-black text-stone-950">{alert.name}</p>
                    <p className="mt-2 text-xs font-semibold text-stone-600">
                      Stock {alert.stockOnHand - alert.stockReserved} / reorder {alert.reorderPoint} / safety {alert.safetyStock}
                    </p>
                  </article>
                ))}
              </div>
            </AdminPanel>
          ) : null}
        </div>
      </div>

      <AdminPanel
        title={locale === "it" ? "Strumenti avanzati" : "低频工具"}
        description={locale === "it" ? "Impostazioni e rettifiche manuali, fuori dal flusso arrivi." : "库存设置、手动调整和低库存规则放在这里，不影响主流程。"}
        toolbar={<SlidersHorizontal className="h-4 w-4 text-stone-500" />}
      >
        <div className="grid gap-2 lg:grid-cols-3">
          <SettingsTool locale={locale} settings={settings} defaultOpen={valueOf(query.tools) === "open"} />
          <AdjustTool locale={locale} productRows={rows} defaultOpen={valueOf(query.tools) === "open"} />
          <ReorderTool locale={locale} productRows={rows} defaultOpen={valueOf(query.tools) === "open"} />
        </div>
      </AdminPanel>
    </div>
  );
}

function InventoryProductCard({ row, locale }: Readonly<{ row: AdminProductRow; locale: Locale }>) {
  const availableStock = row.stockOnHand - row.stockReserved;
  const incomingAvailable = row.incomingQty - row.incomingReserved;

  return (
    <article className="rounded-lg border border-black/5 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <StatusPill status={row.isActive ? (locale === "it" ? "Attivo" : "上架") : (locale === "it" ? "Archiviato" : "下架")} tone={row.isActive ? "green" : "slate"} />
            {incomingAvailable > 0 ? <StatusPill status={locale === "it" ? "In arrivo" : "预到货"} tone="amber" /> : null}
            {isLowStock(row) ? <StatusPill status={locale === "it" ? "Stock basso" : "库存低"} tone="red" /> : null}
          </div>
          <h3 className="mt-2 line-clamp-2 text-sm font-black leading-5 text-stone-950">
            {locale === "it" ? row.nameIt : row.nameZh}
          </h3>
          <p className="mt-1 truncate text-xs font-semibold text-stone-500">
            {row.brand} / {row.model} / {getCategoryLabel(row.category, locale)}
          </p>
        </div>
        <AdminButtonLink href={localizePath(locale, `/admin/products/${row.skuId}`)} variant="secondary">
          {locale === "it" ? "Edit" : "编辑"}
        </AdminButtonLink>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <MiniStat label="SKU" value={row.sku} />
        <MiniStat label="EAN" value={row.barcodeEan13 ?? "-"} />
        <MiniStat label={locale === "it" ? "Stock" : "现货"} value={availableStock} tone={availableStock < 0 ? "red" : "default"} />
        <MiniStat label={locale === "it" ? "Incoming" : "在途"} value={incomingAvailable} tone={incomingAvailable > 0 ? "amber" : "default"} />
        <MiniStat label={locale === "it" ? "Reserved" : "已锁定"} value={row.stockReserved + row.incomingReserved} />
        <MiniStat label={locale === "it" ? "Costo" : "成本"} value={row.costPrice === null ? "-" : formatMoney(row.costPrice, locale)} />
        <MiniStat label={locale === "it" ? "Retail" : "零售价"} value={formatMoney(row.retailPrice, locale)} />
        <MiniStat label={locale === "it" ? "Wholesale" : "批发价"} value={formatMoney(row.b2bPrice, locale)} />
      </div>
    </article>
  );
}

function FilterLinkGroup({
  clearModel = false,
  current,
  items,
  label,
  locale,
  param,
  state,
}: Readonly<{
  clearModel?: boolean;
  current: string;
  items: Array<{ value: string; label?: string; count: number }>;
  label: string;
  locale: Locale;
  param: keyof InventoryFilterState;
  state: InventoryFilterState;
}>) {
  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 className="text-xs font-black uppercase tracking-wide text-stone-500">{label}</h3>
        {current ? (
          <a className="text-xs font-black text-blue-600" href={buildInventoryHref(locale, { ...state, [param]: "", ...(clearModel ? { model: "" } : {}) })}>
            {locale === "it" ? "Reset" : "清空"}
          </a>
        ) : null}
      </div>
      <div className="max-h-72 space-y-1 overflow-auto pr-1">
        {items.map((item) => {
          const active = current === item.value;
          return (
            <a
              className={[
                "flex min-h-9 items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-black transition",
                active ? "bg-stone-950 text-white" : "bg-stone-50 text-stone-700 hover:bg-stone-100 hover:text-stone-950",
              ].join(" ")}
              href={buildInventoryHref(locale, {
                ...state,
                [param]: item.value,
                ...(clearModel ? { model: "" } : {}),
              })}
              key={item.value}
            >
              <span className="min-w-0 truncate">{item.label ?? item.value}</span>
              <span className={active ? "text-white/70" : "text-stone-400"}>{item.count}</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function SettingsTool({
  defaultOpen,
  locale,
  settings,
}: Readonly<{
  defaultOpen?: boolean;
  locale: Locale;
  settings: Awaited<ReturnType<typeof getInventorySettings>>;
}>) {
  return (
    <AdminCollapsiblePanel
      defaultOpen={defaultOpen}
      title={locale === "it" ? "Impostazioni prezzi" : "库存价格设置"}
      summary={locale === "it" ? "Markup e lead time" : "加价和交期"}
    >
      <form action="/api/admin/inventory/settings" method="post" className="grid gap-2">
        <AdminCsrfField />
        <input type="hidden" name="locale" value={locale} />
        <AdminInput name="b2bMarkup" label={locale === "it" ? "Wholesale x" : "批发 x"} defaultValue={String(settings.b2bMarkup)} step="0.001" type="number" />
        <AdminInput name="retailMarkup" label="Retail x" defaultValue={String(settings.retailMarkup)} step="0.001" type="number" />
        <AdminInput name="preorderLeadTimeMinDays" label={locale === "it" ? "Min giorni" : "最短天数"} defaultValue={String(settings.preorderLeadTimeMinDays)} type="number" />
        <AdminInput name="preorderLeadTimeMaxDays" label={locale === "it" ? "Max giorni" : "最长天数"} defaultValue={String(settings.preorderLeadTimeMaxDays)} type="number" />
        <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800" type="submit">
          {locale === "it" ? "Salva" : "保存设置"}
        </button>
      </form>
    </AdminCollapsiblePanel>
  );
}

function AdjustTool({
  defaultOpen,
  locale,
  productRows,
}: Readonly<{
  defaultOpen?: boolean;
  locale: Locale;
  productRows: AdminProductRow[];
}>) {
  return (
    <AdminCollapsiblePanel
      defaultOpen={defaultOpen}
      title={locale === "it" ? "Rettifica stock" : "手动调整库存"}
      summary={locale === "it" ? "Scrive movement" : "同步写入流水"}
    >
      <form action="/api/admin/inventory/adjust" method="post" className="grid gap-2">
        <AdminCsrfField />
        <input type="hidden" name="locale" value={locale} />
        <AdminSelect name="skuId" label="SKU">
          {productRows.map((row) => (
            <option key={row.skuId} value={row.skuId}>{row.sku}</option>
          ))}
        </AdminSelect>
        <AdminSelect name="adjustmentType" label={locale === "it" ? "Tipo" : "类型"} defaultValue="add_stock">
          <option value="add_stock">{locale === "it" ? "+ Stock" : "增加现货"}</option>
          <option value="remove_stock">{locale === "it" ? "- Stock" : "减少现货"}</option>
          <option value="set_stock">{locale === "it" ? "Imposta stock" : "校准现货"}</option>
          <option value="add_incoming">{locale === "it" ? "+ Incoming" : "增加在途"}</option>
          <option value="remove_incoming">{locale === "it" ? "- Incoming" : "减少在途"}</option>
        </AdminSelect>
        <AdminInput name="quantity" label={locale === "it" ? "Quantita" : "数量"} type="number" defaultValue="1" min="0" />
        <AdminInput name="reason" label={locale === "it" ? "Motivo" : "原因"} defaultValue={locale === "it" ? "Correzione inventario" : "库存校准"} />
        <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800" type="submit">
          {locale === "it" ? "Salva rettifica" : "保存调整"}
        </button>
      </form>
    </AdminCollapsiblePanel>
  );
}

function ReorderTool({
  defaultOpen,
  locale,
  productRows,
}: Readonly<{
  defaultOpen?: boolean;
  locale: Locale;
  productRows: AdminProductRow[];
}>) {
  return (
    <AdminCollapsiblePanel
      defaultOpen={defaultOpen}
      title={locale === "it" ? "Regole riordino" : "低库存规则"}
      summary={locale === "it" ? "Alert, non acquisto auto" : "只预警不自动下单"}
    >
      <form action="/api/admin/inventory/reorder-settings" method="post" className="grid gap-2">
        <AdminCsrfField />
        <input type="hidden" name="locale" value={locale} />
        <AdminSelect name="inventoryId" label="SKU">
          {productRows.filter((row) => row.inventoryId).map((row) => (
            <option key={row.inventoryId} value={row.inventoryId ?? ""}>{row.sku}</option>
          ))}
        </AdminSelect>
        <AdminInput name="reorderPoint" label={locale === "it" ? "Punto riordino" : "补货点"} type="number" defaultValue="5" min="0" />
        <AdminInput name="safetyStock" label={locale === "it" ? "Scorta sicurezza" : "安全库存"} type="number" defaultValue="2" min="0" />
        <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800" type="submit">
          {locale === "it" ? "Salva alert" : "保存预警规则"}
        </button>
      </form>
    </AdminCollapsiblePanel>
  );
}

function MiniStat({
  label,
  tone = "default",
  value,
}: Readonly<{ label: string; tone?: "default" | "amber" | "red"; value: ReactNode }>) {
  const toneClass = tone === "red" ? "bg-rose-50 text-rose-700" : tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-stone-50 text-stone-950";
  return (
    <div className={`min-w-0 rounded-lg px-2 py-1.5 ${toneClass}`}>
      <p className="truncate text-[10px] font-black uppercase text-stone-400">{label}</p>
      <p className="mt-0.5 truncate font-black">{value}</p>
    </div>
  );
}

function SystemNotice({
  authConfigured,
  isAdmin,
  hasUser,
  locale,
}: Readonly<{
  authConfigured: boolean;
  isAdmin: boolean;
  hasUser: boolean;
  locale: Locale;
}>) {
  if (!authConfigured) {
    return (
      <AdminNotice tone="warning">
        {locale === "it"
          ? "Demo mode: Supabase non configurato, la pagina usa dati locali."
          : "演示模式：Supabase 未配置，页面使用本地样例数据。"}
      </AdminNotice>
    );
  }

  if (authConfigured && !isAdmin) {
    return (
      <AdminNotice tone="danger">
        {hasUser
          ? locale === "it"
            ? "Il tuo utente non ha ruolo admin."
            : "当前用户不是 admin 角色。"
          : locale === "it"
            ? "Effettua login admin per gestire inventario reale."
            : "请使用管理员账户登录后管理真实库存。"}
      </AdminNotice>
    );
  }

  return null;
}

function Feedback({
  locale,
  query,
}: Readonly<{
  locale: Locale;
  query: Record<string, string | string[] | undefined>;
}>) {
  const error = valueOf(query.error);
  const settingsSaved = valueOf(query.settings);
  const adjusted = valueOf(query.adjusted);
  const reorderSaved = valueOf(query.reorder);

  return (
    <>
      {error ? (
        <AdminNotice tone="danger" title={<AlertTriangle className="h-4 w-4" />}>
          {decodeURIComponent(error)}
        </AdminNotice>
      ) : null}
      {settingsSaved ? (
        <AdminNotice tone="success">{locale === "it" ? "Impostazioni salvate." : "库存设置已保存。"}</AdminNotice>
      ) : null}
      {adjusted ? (
        <AdminNotice tone="success">
          {adjusted === "demo"
            ? locale === "it"
              ? "Demo: rettifica ricevuta."
              : "演示：已接收库存调整。"
            : locale === "it"
              ? "Rettifica inventario salvata."
              : "库存调整已保存。"}
        </AdminNotice>
      ) : null}
      {reorderSaved ? (
        <AdminNotice tone="success">{locale === "it" ? "Regole riordino salvate." : "低库存规则已保存。"}</AdminNotice>
      ) : null}
    </>
  );
}

function filterInventoryRows(rows: AdminProductRow[], state: InventoryFilterState) {
  const query = normalizeSearch(state.q);

  return rows.filter((row) => {
    if (state.brand && row.brand !== state.brand) return false;
    if (state.model && row.model !== state.model) return false;
    if (state.category && row.category !== state.category) return false;
    if (state.status === "in_stock" && row.stockOnHand - row.stockReserved <= 0) return false;
    if (state.status === "incoming" && row.incomingQty - row.incomingReserved <= 0) return false;
    if (state.status === "low_stock" && !isLowStock(row)) return false;
    if (state.status === "shortage" && !(row.incomingReserved > row.incomingQty || row.stockReserved > row.stockOnHand)) return false;
    if (!query) return true;

    const haystack = normalizeSearch([
      row.sku,
      row.barcodeEan13,
      row.nameIt,
      row.nameZh,
      row.brand,
      row.model,
      row.category,
      row.qualityGrade,
      row.compatibility.join(" "),
    ].filter(Boolean).join(" "));

    return haystack.includes(query);
  });
}

function buildInventoryHref(locale: Locale, state: Partial<InventoryFilterState>) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.brand) params.set("brand", state.brand);
  if (state.model) params.set("model", state.model);
  if (state.category) params.set("category", state.category);
  if (state.status && state.status !== "all") params.set("status", state.status);
  const query = params.toString();
  return `${localizePath(locale, "/admin/inventory")}${query ? `?${query}` : ""}`;
}

function getCountedOptions(values: string[]) {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

function getCategoryLabel(categoryId: string, locale: Locale) {
  return categories.find((category) => category.id === categoryId)?.label[locale] ?? categoryId;
}

function isLowStock(row: AdminProductRow) {
  const available = row.stockOnHand - row.stockReserved;
  return (row.safetyStock > 0 && available <= row.safetyStock) || (row.reorderPoint > 0 && available <= row.reorderPoint);
}

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
