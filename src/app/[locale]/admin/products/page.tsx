import { Search } from "lucide-react";
import { AdminCsrfField } from "@/components/admin/admin-csrf-field";
import {
  AdminActionRail,
  AdminButtonLink,
  AdminCollapsiblePanel,
  AdminDataTable,
  AdminEmptyState,
  AdminInput,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTabs,
  AdminTextarea,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import type { AdminProductRow } from "@/lib/admin-products";
import { getAdminCatalogAttributeRows } from "@/lib/admin-catalog";
import { getAdminProductRows } from "@/lib/admin-products";
import { getAuthContext } from "@/lib/auth";
import { categories, qualityStyles } from "@/lib/catalog";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

export default async function AdminProductsPage({
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
  const rows = !auth.configured || auth.isAdmin ? await getAdminProductRows() : [];
  const attributes =
    auth.configured && auth.isAdmin ? await getAdminCatalogAttributeRows() : [];
  const saved = valueOf(query.saved);
  const error = valueOf(query.error);
  const imported = valueOf(query.imported);
  const processed = valueOf(query.processed);
  const importMessage = valueOf(query.message);
  const attributeSaved = valueOf(query.attribute);
  const translations = valueOf(query.translations);
  const translationUpdated = valueOf(query.updated);
  const translationSkipped = valueOf(query.skipped);
  const archived = valueOf(query.archived);
  const published = valueOf(query.published);
  const bulk = valueOf(query.bulk);
  const statusFilter = valueOf(query.status) ?? "all";
  const visibleRows = filterProductRows(rows, statusFilter);
  const filterCounts = getProductFilterCounts(rows);
  const filterItems = [
    ["all", locale === "it" ? "Tutti" : "全部"],
    ["needs", locale === "it" ? "Da completare" : "待完善"],
    ["published", locale === "it" ? "Pubblicati" : "已发布"],
    ["archived", locale === "it" ? "Archiviati" : "已下架"],
    ["missing_zh", locale === "it" ? "Senza ZH" : "缺中文"],
    ["stock_risk", locale === "it" ? "Rischio stock" : "库存风险"],
  ].map(([value, label]) => ({
    href: `${localizePath(locale, "/admin/products")}${value === "all" ? "" : `?status=${value}`}`,
    label,
    active: statusFilter === value,
    count: filterCounts[value] ?? 0,
  }));

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Product components" : "商品组件"}
        title={locale === "it" ? "Gestione catalogo" : "商品目录管理"}
        description={
          locale === "it"
            ? "Crea SKU operativi con prezzo retail, prezzo B2B, stock e incoming. I salvataggi restano collegati a products, skus e inventory."
            : "创建带零售价、B2B 价、库存和在途数量的 SKU。保存仍连接 products、skus 和 inventory。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin")} variant="secondary">
              {locale === "it" ? "Dashboard" : "后台首页"}
            </AdminButtonLink>
            {!auth.user && auth.configured ? (
              <AdminButtonLink href={localizePath(locale, "/login")} variant="secondary">
                {locale === "it" ? "Login" : "登录"}
              </AdminButtonLink>
            ) : null}
          </>
        }
      />

      <SystemNotices configured={auth.configured} isAdmin={auth.isAdmin} hasUser={Boolean(auth.user)} locale={locale} />
      <FeedbackNotices
        locale={locale}
        saved={saved}
        error={error}
        imported={imported}
        processed={processed}
        importMessage={importMessage}
        attributeSaved={attributeSaved}
        translations={translations}
        translationUpdated={translationUpdated}
        translationSkipped={translationSkipped}
        archived={archived}
        published={published}
        bulk={bulk}
      />

      <AdminWorkspaceGrid
        rail={
          <AdminActionRail
            title={locale === "it" ? "Azioni catalogo" : "目录操作"}
            description={locale === "it" ? "Form a bassa frequenza" : "低频表单默认折叠"}
          >
            <AdminCollapsiblePanel
              title={locale === "it" ? "Import da price_*" : "从 price_* 导入"}
              summary={locale === "it" ? "Batch products/skus" : "批量导入 products/skus"}
            >
              <form action="/api/admin/catalog/import" method="post" className="flex flex-wrap gap-2">
                <AdminCsrfField />
                <input type="hidden" name="locale" value={locale} />
                <AdminInput
                  className="w-28"
                  name="batchSize"
                  defaultValue="500"
                  type="number"
                  min="1"
                  max="5000"
                  label="Batch"
                />
                <button
                  type="submit"
                  className="mt-5 h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800"
                >
                  {locale === "it" ? "Importa" : "导入"}
                </button>
              </form>
            </AdminCollapsiblePanel>

            <AdminCollapsiblePanel
              title={locale === "it" ? "Nuovo parametro filtro" : "新建筛选参数"}
              summary={locale === "it" ? "Filtri dinamici" : "动态筛选字段"}
            >
              <form action="/api/admin/catalog/attributes" method="post" className="grid gap-2">
                <AdminCsrfField />
                <input type="hidden" name="locale" value={locale} />
                <AdminInput name="key" label="Key" defaultValue="screen_technology" />
                <AdminInput name="labelIt" label="Label IT" defaultValue="Tecnologia display" />
                <AdminInput name="labelZh" label="中文标签" defaultValue="屏幕技术" />
                <AdminSelect name="inputType" label="Type" defaultValue="select">
                  <option value="select">select</option>
                  <option value="boolean">boolean</option>
                  <option value="number">number</option>
                  <option value="text">text</option>
                </AdminSelect>
                <AdminInput name="unit" label="Unit" defaultValue="" required={false} />
                <label className="flex items-center gap-2 text-xs font-black text-stone-700">
                  <input name="isFilterable" type="checkbox" defaultChecked className="h-4 w-4 accent-stone-950" />
                  Filterable
                </label>
                <AdminTextarea
                  name="options"
                  label="Options"
                  defaultValue={"soft-oled|Soft OLED|Soft OLED\nhard-oled|Hard OLED|Hard OLED"}
                />
                <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800" type="submit">
                  {locale === "it" ? "Salva parametro" : "保存参数"}
                </button>
              </form>
            </AdminCollapsiblePanel>

            <AdminCollapsiblePanel
              title={locale === "it" ? "Traduzioni cinese" : "中文商品名"}
              summary={locale === "it" ? "Genera nomi ZH" : "批量生成中文名"}
            >
              <form action="/api/admin/catalog/translations" method="post" className="grid gap-2">
                <AdminCsrfField />
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="mode" value="batch" />
                <AdminInput name="limit" defaultValue="300" type="number" min="1" max="1000" label="Limit" />
                <label className="flex items-center gap-2 text-xs font-black text-stone-700">
                  <input name="overwrite" type="checkbox" value="true" className="h-4 w-4 accent-stone-950" />
                  {locale === "it" ? "Sovrascrivi manuali" : "覆盖人工中文名"}
                </label>
                <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800" type="submit">
                  {locale === "it" ? "Genera" : "生成"}
                </button>
              </form>
            </AdminCollapsiblePanel>

            <AdminCollapsiblePanel
              title={locale === "it" ? "Nuovo SKU" : "新建 SKU"}
              summary={locale === "it" ? "Prodotto + inventory" : "商品 + 库存"}
            >
              <form action="/api/admin/products" method="post" className="grid gap-2">
                <AdminCsrfField />
                <input type="hidden" name="locale" value={locale} />
                <AdminInput name="slug" label="Slug" defaultValue="iphone-15-pro-soft-oled-display" />
                <AdminInput name="sku" label="SKU" defaultValue="APL-IP15P-SCR-SO-BLK" />
                <AdminInput name="barcodeEan13" label="EAN-13" defaultValue="" required={false} />
                <AdminInput name="brand" label="Brand" defaultValue="Apple" />
                <AdminInput name="model" label="Model" defaultValue="iPhone 15 Pro" />
                <AdminSelect name="category" label="Category" defaultValue="screens">
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label[locale]}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect name="qualityGrade" label="Quality" defaultValue="Soft OLED">
                  {Object.keys(qualityStyles).map((quality) => (
                    <option key={quality}>{quality}</option>
                  ))}
                </AdminSelect>
                <AdminInput name="nameIt" label="Nome IT" defaultValue="Display iPhone 15 Pro Soft OLED nero" />
                <AdminInput name="nameZh" label="中文名" defaultValue="iPhone 15 Pro Soft OLED 黑色屏幕" />
                <AdminInput name="color" label="Color" defaultValue="Black" />
                <AdminInput name="moq" label="MOQ" defaultValue="1" type="number" />
                <AdminInput name="costPrice" label="Cost EUR" defaultValue="" type="number" step="0.01" required={false} />
                <AdminInput name="retailPrice" label="Retail EUR" defaultValue="119.90" type="number" step="0.01" />
                <AdminInput name="b2bPrice" label="B2B EUR" defaultValue="92.50" type="number" step="0.01" />
                <AdminInput name="stockOnHand" label="Stock" defaultValue="20" type="number" />
                <AdminInput name="incomingQty" label="Incoming" defaultValue="60" type="number" />
                <AdminInput name="imageUrl" label="Image URL" defaultValue="https://images.unsplash.com/photo-1581993192008-63e896f4f744?auto=format&fit=crop&w=900&q=80" />
                <AdminInput name="compatibility" label="Compatibility" defaultValue="iPhone 15 Pro, A2848, A3101" />
                <AdminTextarea name="descriptionIt" label="Description IT" defaultValue="Display compatibile Soft OLED per riparazioni professionali." />
                <AdminTextarea name="descriptionZh" label="中文描述" defaultValue="适合专业维修场景的 Soft OLED 兼容屏。" />
                <AdminTextarea textareaClassName="font-mono" name="attributes" label="Attributes" defaultValue={"screen_technology=soft-oled\nwith_frame=yes\nwarranty=6-months"} />
                <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800" type="submit">
                  {locale === "it" ? "Salva SKU" : "保存 SKU"}
                </button>
              </form>
            </AdminCollapsiblePanel>

            <AdminCollapsiblePanel
              title={locale === "it" ? "Azioni bulk" : "批量状态"}
              summary={locale === "it" ? "Filtro corrente" : "当前筛选结果"}
            >
              <form action="/api/admin/products/bulk" method="post" className="grid gap-2">
                <AdminCsrfField />
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="ids" value={visibleRows.map((row) => row.skuId).join(",")} />
                <AdminSelect name="action" label={locale === "it" ? "Azione" : "操作"} defaultValue="publish">
                  <option value="publish">{locale === "it" ? "Pubblica" : "发布"}</option>
                  <option value="archive">{locale === "it" ? "Archivia" : "下架"}</option>
                </AdminSelect>
                <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800" type="submit">
                  {locale === "it" ? "Applica al filtro" : "应用到当前筛选"}
                </button>
              </form>
            </AdminCollapsiblePanel>
          </AdminActionRail>
        }
      >
        <AdminTabs items={filterItems} />

        {attributes.length > 0 ? (
          <AdminPanel title={locale === "it" ? "Parametri attivi" : "当前筛选参数"}>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {attributes.map((attribute) => (
                <div key={attribute.id} className="rounded-lg border border-black/5 bg-stone-50 p-2.5">
                  <p className="font-mono text-[11px] font-black text-stone-500">{attribute.key}</p>
                  <p className="mt-1 text-sm font-black text-stone-950">
                    {locale === "it" ? attribute.labelIt : attribute.labelZh}
                  </p>
                  <p className="text-xs font-semibold text-stone-500">
                    {attribute.inputType}
                    {attribute.unit ? ` / ${attribute.unit}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </AdminPanel>
        ) : null}

      <AdminPanel
        title={locale === "it" ? "SKU catalogo" : "商品 SKU 列表"}
        toolbar={<StatusPill status={`${visibleRows.length} / ${rows.length} SKU`} tone="blue" />}
      >
        {visibleRows.length ? (
          <AdminDataTable
            minWidth={1680}
            mobileBreakpoint="lg"
            mobileCards={<ProductMobileCards rows={visibleRows} locale={locale} />}
          >
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-stone-400">
                <tr className="border-b border-black/5">
                  <th className="px-2.5 py-2">SKU</th>
                  <th className="px-2.5 py-2">EAN</th>
                  <th className="px-2.5 py-2">Product</th>
                  <th className="px-2.5 py-2">中文维护</th>
                  <th className="px-2.5 py-2">Brand / Model</th>
                  <th className="px-2.5 py-2">Quality</th>
                  <th className="px-2.5 py-2">Cost</th>
                  <th className="px-2.5 py-2">Retail</th>
                  <th className="px-2.5 py-2">B2B</th>
                  <th className="px-2.5 py-2">Stock</th>
                  <th className="px-2.5 py-2">Reserved</th>
                  <th className="px-2.5 py-2">Incoming</th>
                  <th className="px-2.5 py-2">Status</th>
                  <th className="px-2.5 py-2">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {visibleRows.map((row) => (
                  <tr key={row.id} className="align-top hover:bg-stone-50">
                    <td className="px-2.5 py-2.5 font-mono text-xs font-black text-stone-800">
                      {row.sku}
                    </td>
                    <td className="px-2.5 py-2.5 font-mono text-xs font-semibold text-stone-500">
                      {row.barcodeEan13 || "-"}
                    </td>
                    <td className="px-2.5 py-2.5">
                      <p className="font-black text-stone-950">
                        {locale === "it" ? row.nameIt : row.nameZh}
                      </p>
                      <p className="mt-1 text-xs font-medium text-stone-500">IT: {row.nameIt}</p>
                      <p className="mt-1 text-xs font-medium text-stone-500">ZH: {row.nameZh}</p>
                      <p className="mt-1 text-xs font-medium text-stone-400">{row.slug}</p>
                    </td>
                    <td className="px-2.5 py-2.5">
                      <form
                        action="/api/admin/catalog/translations"
                        method="post"
                        className="grid min-w-[260px] gap-2"
                      >
                        <AdminCsrfField />
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="mode" value="manual" />
                        <input type="hidden" name="productId" value={row.productId} />
                        <input
                          name="nameZh"
                          defaultValue={row.nameZh}
                          className="h-9 rounded-lg border border-black/10 bg-white px-2 text-xs font-semibold outline-none focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10"
                        />
                        <textarea
                          name="descriptionZh"
                          defaultValue={row.descriptionZh ?? ""}
                          className="min-h-16 rounded-lg border border-black/10 bg-white p-2 text-xs font-semibold outline-none focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10"
                        />
                        <button
                          type="submit"
                          className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800"
                        >
                          {locale === "it" ? "Salva ZH" : "保存中文"}
                        </button>
                      </form>
                    </td>
                    <td className="px-2.5 py-2.5 font-semibold text-stone-700">
                      {row.brand} / {row.model}
                    </td>
                    <td className="px-2.5 py-2.5">
                      <StatusPill status={row.qualityGrade} tone="slate" />
                    </td>
                    <td className="px-2.5 py-2.5">
                      {row.costPrice === null ? "-" : formatMoney(row.costPrice, locale)}
                    </td>
                    <td className="px-2.5 py-2.5">{formatMoney(row.retailPrice, locale)}</td>
                    <td className="px-2.5 py-2.5 font-black text-sky-700">
                      {formatMoney(row.b2bPrice, locale)}
                    </td>
                    <td className="px-2.5 py-2.5 font-black text-stone-950">
                      {row.stockOnHand}
                    </td>
                    <td className="px-2.5 py-2.5 text-stone-700">
                      {row.stockReserved}
                      {row.incomingReserved ? (
                        <span className="ml-1 text-xs font-black text-violet-700">
                          / {row.incomingReserved}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2.5 py-2.5">
                      <span className="font-black text-violet-700">
                        {Math.max(row.incomingQty - row.incomingReserved, 0)}
                      </span>
                      <span className="ml-1 text-xs font-semibold text-stone-500">
                        / {row.incomingQty}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5">
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        <StatusPill status={row.isActive ? "Published" : "Archived"} tone={row.isActive ? "green" : "slate"} />
                        {row.completenessIssues.slice(0, 2).map((issue) => (
                          <StatusPill key={issue} status={issue} tone={issue === "stock_risk" ? "amber" : "blue"} />
                        ))}
                      </div>
                    </td>
                    <td className="px-2.5 py-2.5">
                      <AdminButtonLink href={localizePath(locale, `/admin/products/${row.skuId}`)} variant="secondary">
                        {locale === "it" ? "Apri" : "详情"}
                      </AdminButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminDataTable>
        ) : (
          <AdminEmptyState
            icon={Search}
            title={locale === "it" ? "Nessuno SKU" : "暂无 SKU"}
            description={
              locale === "it"
                ? "Crea un nuovo SKU o importa il catalogo."
                : "可以新建 SKU 或导入目录。"
            }
          />
        )}
      </AdminPanel>
      </AdminWorkspaceGrid>
    </div>
  );
}

function SystemNotices({
  configured,
  isAdmin,
  hasUser,
  locale,
}: Readonly<{
  configured: boolean;
  isAdmin: boolean;
  hasUser: boolean;
  locale: Locale;
}>) {
  if (!configured) {
    return (
      <AdminNotice tone="warning">
        {locale === "it"
          ? "Demo mode: Supabase non configurato, la tabella usa dati locali."
          : "演示模式：Supabase 未配置，表格使用本地样例数据。"}
      </AdminNotice>
    );
  }

  if (!isAdmin) {
    return (
      <AdminNotice tone="danger">
        {hasUser
          ? locale === "it"
            ? "Il tuo utente non ha ruolo admin."
            : "当前用户不是 admin 角色。"
          : locale === "it"
            ? "Effettua login admin per gestire prodotti reali."
            : "请使用管理员账户登录后管理真实商品。"}
      </AdminNotice>
    );
  }

  return null;
}

function FeedbackNotices({
  locale,
  saved,
  error,
  imported,
  processed,
  importMessage,
  attributeSaved,
  translations,
  translationUpdated,
  translationSkipped,
  archived,
  published,
  bulk,
}: Readonly<{
  locale: Locale;
  saved?: string;
  error?: string;
  imported?: string;
  processed?: string;
  importMessage?: string;
  attributeSaved?: string;
  translations?: string;
  translationUpdated?: string;
  translationSkipped?: string;
  archived?: string;
  published?: string;
  bulk?: string;
}>) {
  return (
    <>
      {saved ? (
        <AdminNotice tone="success">
          {saved === "demo"
            ? locale === "it"
              ? "Demo: richiesta ricevuta, configura Supabase per salvare."
              : "演示：已收到请求，配置 Supabase 后可真实保存。"
            : locale === "it"
              ? "Prodotto salvato."
              : "商品已保存。"}
        </AdminNotice>
      ) : null}

      {error ? <AdminNotice tone="danger">{decodeURIComponent(error)}</AdminNotice> : null}

      {imported ? (
        <AdminNotice tone="info">
          {locale === "it"
            ? `Import catalogo: ${processed || "0"} righe lette, ${imported} SKU importati. Stato: ${importMessage || "ok"}.`
            : `目录导入：读取 ${processed || "0"} 行，导入 ${imported} 个 SKU。状态：${importMessage || "ok"}。`}
        </AdminNotice>
      ) : null}

      {attributeSaved ? (
        <AdminNotice tone="success">
          {locale === "it" ? "Parametro salvato." : "参数已保存。"}
        </AdminNotice>
      ) : null}

      {translations ? (
        <AdminNotice tone="success">
          {locale === "it"
            ? `Traduzioni catalogo salvate: ${translationUpdated || "0"} aggiornate, ${translationSkipped || "0"} saltate.`
            : `目录中文翻译已保存：更新 ${translationUpdated || "0"} 条，跳过 ${translationSkipped || "0"} 条。`}
        </AdminNotice>
      ) : null}

      {archived || published || bulk ? (
        <AdminNotice tone="success">
          {bulk
            ? locale === "it"
              ? `Azione bulk completata: ${bulk}.`
              : `批量操作完成：${bulk}。`
            : archived
              ? locale === "it"
                ? "SKU archiviato."
                : "SKU 已下架。"
              : locale === "it"
                ? "SKU pubblicato."
                : "SKU 已发布。"}
        </AdminNotice>
      ) : null}
    </>
  );
}

function filterProductRows(rows: AdminProductRow[], filter: string) {
  if (filter === "needs") {
    return rows.filter(
      (row) => row.isActive && row.completenessIssues.some((issue) => issue !== "archived"),
    );
  }
  if (filter === "published") return rows.filter((row) => row.isActive);
  if (filter === "archived") return rows.filter((row) => !row.isActive);
  if (filter === "missing_zh") {
    return rows.filter((row) =>
      row.completenessIssues.some((issue) => issue.startsWith("missing_zh")),
    );
  }
  if (filter === "stock_risk") {
    return rows.filter((row) => row.completenessIssues.includes("stock_risk"));
  }
  return rows;
}

function getProductFilterCounts(rows: AdminProductRow[]) {
  const counts: Record<string, number> = {
    all: rows.length,
    needs: 0,
    published: 0,
    archived: 0,
    missing_zh: 0,
    stock_risk: 0,
  };

  rows.forEach((row) => {
    if (row.isActive) counts.published += 1;
    if (!row.isActive) counts.archived += 1;
    if (row.isActive && row.completenessIssues.some((issue) => issue !== "archived")) {
      counts.needs += 1;
    }
    if (row.completenessIssues.some((issue) => issue.startsWith("missing_zh"))) {
      counts.missing_zh += 1;
    }
    if (row.completenessIssues.includes("stock_risk")) {
      counts.stock_risk += 1;
    }
  });

  return counts;
}

function ProductMobileCards({
  rows,
  locale,
}: Readonly<{ rows: AdminProductRow[]; locale: Locale }>) {
  return (
    <div className="grid gap-2">
      {rows.map((row) => (
        <article key={row.skuId} className="rounded-lg border border-black/5 bg-stone-50 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="break-all font-mono text-xs font-black text-stone-900">
                {row.sku}
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-black leading-5 text-stone-950">
                {locale === "it" ? row.nameIt : row.nameZh || row.nameIt}
              </p>
              <p className="mt-1 truncate text-xs font-semibold text-stone-500">
                {row.brand} / {row.model}
              </p>
            </div>
            <StatusPill
              status={row.isActive ? "Published" : "Archived"}
              tone={row.isActive ? "green" : "slate"}
            />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="font-black text-stone-400">Retail</p>
              <p className="mt-0.5 font-black text-stone-950">
                {formatMoney(row.retailPrice, locale)}
              </p>
            </div>
            <div>
              <p className="font-black text-stone-400">B2B</p>
              <p className="mt-0.5 font-black text-sky-700">
                {formatMoney(row.b2bPrice, locale)}
              </p>
            </div>
            <div>
              <p className="font-black text-stone-400">Stock</p>
              <p className="mt-0.5 font-black text-stone-950">
                {row.stockOnHand - row.stockReserved}
                <span className="ml-1 text-stone-400">/ {row.incomingQty}</span>
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <StatusPill status={row.qualityGrade} tone="slate" />
            {row.completenessIssues.slice(0, 3).map((issue) => (
              <StatusPill
                key={issue}
                status={issue}
                tone={issue === "stock_risk" ? "amber" : "blue"}
              />
            ))}
          </div>
          <div className="mt-3">
            <AdminButtonLink
              href={localizePath(locale, `/admin/products/${row.skuId}`)}
              variant="secondary"
            >
              {locale === "it" ? "Apri dettaglio" : "打开详情"}
            </AdminButtonLink>
          </div>
        </article>
      ))}
    </div>
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
