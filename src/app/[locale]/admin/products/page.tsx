import { Search } from "lucide-react";
import { AdminCsrfField } from "@/components/admin/admin-csrf-field";
import {
  AdminButtonLink,
  AdminCollapsiblePanel,
  AdminEmptyState,
  AdminInput,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTabs,
  AdminTextarea,
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
  const attributes = auth.configured && auth.isAdmin ? await getAdminCatalogAttributeRows() : [];
  const state = {
    q: valueOf(query.q) ?? "",
    brand: valueOf(query.brand) ?? "",
    model: valueOf(query.model) ?? "",
    status: valueOf(query.status) ?? "all",
  };
  const filteredRows = filterProductRows(rows, state);
  const filterCounts: Record<string, number> = getProductFilterCounts(rows);
  const brandOptions = getUniqueOptions(rows.map((row) => row.brand));
  const modelOptions = getUniqueOptions(
    rows
      .filter((row) => !state.brand || row.brand === state.brand)
      .map((row) => row.model),
  );
  const returnTo = buildProductsHref(locale, state);
  const filterItems = [
    ["all", locale === "it" ? "Tutti" : "全部"],
    ["needs", locale === "it" ? "Da completare" : "待完善"],
    ["published", locale === "it" ? "Pubblicati" : "已发布"],
    ["archived", locale === "it" ? "Archiviati" : "已下架"],
    ["missing_zh", locale === "it" ? "Senza ZH" : "缺中文"],
    ["stock_risk", locale === "it" ? "Rischio stock" : "库存风险"],
  ].map(([value, label]) => ({
    href: buildProductsHref(locale, { ...state, status: value }),
    label,
    active: state.status === value,
    count: filterCounts[value] ?? 0,
  }));

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Catalog workspace" : "商品工作台"}
        title={locale === "it" ? "Gestione catalogo" : "商品目录管理"}
        description={
          locale === "it"
            ? "Cerca come nel catalogo pubblico, apri una scheda SKU e modifica tutto nel contenuto principale."
            : "按前台目录同样的方式查找商品，点开 SKU 后直接在主内容区编辑。"
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
      <FeedbackNotices query={query} locale={locale} />

      <AdminPanel title={locale === "it" ? "Cerca e filtra" : "查找商品"} toolbar={<StatusPill status={`${filteredRows.length} / ${rows.length} SKU`} tone="blue" />}>
        <form action={localizePath(locale, "/admin/products")} method="get" className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_180px_180px_auto] md:items-end">
          <AdminInput name="q" label={locale === "it" ? "Cerca nome, SKU, EAN" : "搜索名称、SKU、EAN"} defaultValue={state.q} required={false} />
          <AdminSelect name="brand" label={locale === "it" ? "Brand" : "品牌"} defaultValue={state.brand}>
            <option value="">{locale === "it" ? "Tutti" : "全部品牌"}</option>
            {brandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
          </AdminSelect>
          <AdminSelect name="model" label={locale === "it" ? "Modello" : "型号"} defaultValue={state.model}>
            <option value="">{locale === "it" ? "Tutti" : "全部型号"}</option>
            {modelOptions.map((model) => <option key={model} value={model}>{model}</option>)}
          </AdminSelect>
          <input type="hidden" name="status" value={state.status} />
          <button className="h-10 rounded-lg bg-stone-950 px-4 text-sm font-black text-white" type="submit">
            {locale === "it" ? "Cerca" : "搜索"}
          </button>
        </form>
      </AdminPanel>

      <AdminPanel title={locale === "it" ? "Strumenti catalogo" : "目录工具"}>
        <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-5">
          <ImportTool locale={locale} />
          <NewSkuTool locale={locale} />
          <TranslationTool locale={locale} />
          <AttributeTool locale={locale} />
          <BulkTool locale={locale} rows={filteredRows} />
        </div>
      </AdminPanel>

      <AdminTabs items={filterItems} />

      {attributes.length > 0 ? (
        <details className="rounded-lg border border-black/10 bg-white p-3">
          <summary className="cursor-pointer text-sm font-black text-stone-950">
            {locale === "it" ? "Parametri filtro attivi" : "当前筛选参数"}
          </summary>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
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
        </details>
      ) : null}

      <AdminPanel title={locale === "it" ? "Risultati SKU" : "SKU 结果"}>
        {filteredRows.length ? (
          <div className="grid gap-2">
            {filteredRows.map((row) => (
              <ProductEditCard key={row.id} row={row} locale={locale} returnTo={returnTo} />
            ))}
          </div>
        ) : (
          <AdminEmptyState
            icon={Search}
            title={locale === "it" ? "Nessuno SKU" : "暂无 SKU"}
            description={locale === "it" ? "Modifica ricerca o usa gli strumenti catalogo." : "调整搜索条件，或使用目录工具新建/导入商品。"}
          />
        )}
      </AdminPanel>
    </div>
  );
}

function ProductEditCard({
  row,
  locale,
  returnTo,
}: Readonly<{ row: AdminProductRow; locale: Locale; returnTo: string }>) {
  return (
    <details className="rounded-lg border border-black/10 bg-white p-3 shadow-sm open:border-blue-200 open:bg-blue-50/20">
      <summary className="grid cursor-pointer list-none gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusPill status={row.isActive ? (locale === "it" ? "Pubblicato" : "已发布") : (locale === "it" ? "Archiviato" : "已下架")} tone={row.isActive ? "green" : "slate"} />
            <StatusPill status={row.qualityGrade} tone="slate" />
            {row.completenessIssues.slice(0, 2).map((issue) => (
              <StatusPill key={issue} status={issue} tone={issue === "stock_risk" ? "amber" : "blue"} />
            ))}
          </div>
          <h2 className="mt-2 break-words text-sm font-black text-stone-950 md:text-base">
            {locale === "it" ? row.nameIt : row.nameZh}
          </h2>
          <p className="mt-1 break-words text-xs font-semibold text-stone-500">
            {row.brand} / {row.model} / {row.category} / {row.barcodeEan13 || row.sku}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-right text-xs sm:grid-cols-6 lg:w-[560px]">
          <MiniStat label={locale === "it" ? "Cost" : "成本"} value={row.costPrice === null ? "-" : formatMoney(row.costPrice, locale)} />
          <MiniStat label={locale === "it" ? "Retail" : "零售"} value={formatMoney(row.retailPrice, locale)} />
          <MiniStat label={locale === "it" ? "Wholesale" : "批发"} value={formatMoney(row.b2bPrice, locale)} />
          <MiniStat label={locale === "it" ? "Stock" : "现货"} value={String(row.stockOnHand)} />
          <MiniStat label={locale === "it" ? "Incoming" : "在途"} value={String(row.incomingQty)} />
          <MiniStat label="MOQ" value={String(row.moq)} />
        </div>
      </summary>

      <div className="mt-3 border-t border-black/5 pt-3">
        <form action="/api/admin/products/update" method="post" className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <AdminCsrfField />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="hidden" name="productId" value={row.productId} />
          <input type="hidden" name="skuId" value={row.skuId} />
          <AdminInput name="slug" label="Slug" defaultValue={row.slug} />
          <AdminInput name="sku" label="SKU" defaultValue={row.sku} />
          <AdminInput name="barcodeEan13" label="EAN-13" defaultValue={row.barcodeEan13 ?? ""} required={false} />
          <AdminInput name="brand" label={locale === "it" ? "Brand" : "品牌"} defaultValue={row.brand} />
          <AdminInput name="model" label={locale === "it" ? "Modello" : "型号"} defaultValue={row.model} />
          <AdminSelect name="category" label={locale === "it" ? "Categoria" : "品类"} defaultValue={row.category}>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.label[locale]}</option>)}
          </AdminSelect>
          <AdminSelect name="qualityGrade" label={locale === "it" ? "Qualita" : "质量"} defaultValue={row.qualityGrade}>
            {Object.keys(qualityStyles).map((quality) => <option key={quality}>{quality}</option>)}
          </AdminSelect>
          <AdminInput name="color" label={locale === "it" ? "Colore" : "颜色"} defaultValue={row.color ?? ""} required={false} />
          <AdminInput name="moq" label="MOQ" defaultValue={String(row.moq)} type="number" />
          <AdminInput name="costPrice" label={locale === "it" ? "Cost EUR" : "成本 EUR"} defaultValue={row.costPrice === null ? "" : String(row.costPrice)} type="number" step="0.01" required={false} />
          <AdminInput name="retailPrice" label={locale === "it" ? "Retail EUR" : "零售 EUR"} defaultValue={String(row.retailPrice)} type="number" step="0.01" />
          <AdminInput name="b2bPrice" label={locale === "it" ? "Wholesale EUR" : "批发 EUR"} defaultValue={String(row.b2bPrice)} type="number" step="0.01" />
          <AdminInput name="nameIt" label="Nome IT" defaultValue={row.nameIt} />
          <AdminInput name="nameZh" label="中文名" defaultValue={row.nameZh} />
          <AdminInput name="imageUrl" label="Image URL" defaultValue={row.imageUrl ?? ""} required={false} />
          <AdminInput name="compatibility" label={locale === "it" ? "Compatibilita" : "兼容"} defaultValue={row.compatibility.join(", ")} required={false} />
          <div className="md:col-span-2">
            <AdminTextarea name="descriptionIt" label="Description IT" defaultValue={row.descriptionIt ?? ""} />
          </div>
          <div className="md:col-span-2">
            <AdminTextarea name="descriptionZh" label="中文描述" defaultValue={row.descriptionZh ?? ""} />
          </div>
          <div className="md:col-span-2 xl:col-span-4">
            <AdminTextarea textareaClassName="font-mono" name="attributes" label={locale === "it" ? "Parametri key=value" : "参数 key=value"} defaultValue="" />
          </div>
          <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-4">
            <button className="h-9 rounded-lg bg-stone-950 px-4 text-xs font-black text-white" type="submit">
              {locale === "it" ? "Salva modifiche" : "保存修改"}
            </button>
            <AdminButtonLink href={localizePath(locale, `/admin/products/${row.skuId}`)} variant="secondary">
              {locale === "it" ? "Dettaglio completo" : "完整详情"}
            </AdminButtonLink>
          </div>
        </form>
        <div className="mt-2 flex flex-wrap gap-2">
          <ProductStateForm action={row.isActive ? "archive" : "publish"} row={row} locale={locale} returnTo={returnTo} />
        </div>
      </div>
    </details>
  );
}

function ProductStateForm({
  action,
  row,
  locale,
  returnTo,
}: Readonly<{ action: "archive" | "publish"; row: AdminProductRow; locale: Locale; returnTo: string }>) {
  return (
    <form action={`/api/admin/products/${action}`} method="post">
      <AdminCsrfField />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="productId" value={row.productId} />
      <input type="hidden" name="skuId" value={row.skuId} />
      <button className="h-9 rounded-lg border border-black/10 bg-white px-3 text-xs font-black text-stone-700 hover:border-black/20" type="submit">
        {action === "archive"
          ? locale === "it" ? "Archivia" : "下架"
          : locale === "it" ? "Pubblica" : "发布"}
      </button>
    </form>
  );
}

function ImportTool({ locale }: Readonly<{ locale: Locale }>) {
  return (
    <AdminCollapsiblePanel title={locale === "it" ? "Import price_*" : "导入 price_*"} summary={locale === "it" ? "Batch" : "批量"}>
      <form action="/api/admin/catalog/import" method="post" className="flex flex-wrap gap-2">
        <AdminCsrfField />
        <input type="hidden" name="locale" value={locale} />
        <AdminInput className="w-28" name="batchSize" defaultValue="500" type="number" min="1" max="5000" label="Batch" />
        <button type="submit" className="mt-5 h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white">
          {locale === "it" ? "Importa" : "导入"}
        </button>
      </form>
    </AdminCollapsiblePanel>
  );
}

function TranslationTool({ locale }: Readonly<{ locale: Locale }>) {
  return (
    <AdminCollapsiblePanel title={locale === "it" ? "Traduzioni ZH" : "中文商品名"} summary={locale === "it" ? "Batch" : "批量"}>
      <form action="/api/admin/catalog/translations" method="post" className="grid gap-2">
        <AdminCsrfField />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="mode" value="batch" />
        <AdminInput name="limit" defaultValue="300" type="number" min="1" max="1000" label="Limit" />
        <label className="flex items-center gap-2 text-xs font-black text-stone-700">
          <input name="overwrite" type="checkbox" value="true" className="h-4 w-4 accent-stone-950" />
          {locale === "it" ? "Sovrascrivi manuali" : "覆盖人工中文名"}
        </label>
        <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
          {locale === "it" ? "Genera" : "生成"}
        </button>
      </form>
    </AdminCollapsiblePanel>
  );
}

function AttributeTool({ locale }: Readonly<{ locale: Locale }>) {
  return (
    <AdminCollapsiblePanel title={locale === "it" ? "Parametro filtro" : "筛选参数"} summary={locale === "it" ? "Nuovo" : "新建"}>
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
        <AdminTextarea name="options" label="Options" defaultValue={"soft-oled|Soft OLED|Soft OLED\nhard-oled|Hard OLED|Hard OLED"} />
        <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
          {locale === "it" ? "Salva" : "保存"}
        </button>
      </form>
    </AdminCollapsiblePanel>
  );
}

function NewSkuTool({ locale }: Readonly<{ locale: Locale }>) {
  return (
    <AdminCollapsiblePanel title={locale === "it" ? "Nuovo SKU" : "新建 SKU"} summary={locale === "it" ? "Prodotto" : "商品"}>
      <form action="/api/admin/products" method="post" className="grid gap-2">
        <AdminCsrfField />
        <input type="hidden" name="locale" value={locale} />
        <AdminInput name="slug" label="Slug" defaultValue="iphone-15-pro-soft-oled-display" />
        <AdminInput name="sku" label="SKU" defaultValue="APL-IP15P-SCR-SO-BLK" />
        <AdminInput name="brand" label="Brand" defaultValue="Apple" />
        <AdminInput name="model" label="Model" defaultValue="iPhone 15 Pro" />
        <AdminSelect name="category" label="Category" defaultValue="screens">
          {categories.map((category) => <option key={category.id} value={category.id}>{category.label[locale]}</option>)}
        </AdminSelect>
        <AdminSelect name="qualityGrade" label="Quality" defaultValue="Soft OLED">
          {Object.keys(qualityStyles).map((quality) => <option key={quality}>{quality}</option>)}
        </AdminSelect>
        <AdminInput name="nameIt" label="Nome IT" defaultValue="Display iPhone 15 Pro Soft OLED nero" />
        <AdminInput name="nameZh" label="中文名" defaultValue="iPhone 15 Pro Soft OLED 黑色屏幕" />
        <AdminInput name="barcodeEan13" label="EAN-13" defaultValue="" required={false} />
        <AdminInput name="color" label="Color" defaultValue="Black" />
        <AdminInput name="moq" label="MOQ" defaultValue="1" type="number" />
        <AdminInput name="costPrice" label="Cost EUR" defaultValue="" type="number" step="0.01" required={false} />
        <AdminInput name="retailPrice" label="Retail EUR" defaultValue="119.90" type="number" step="0.01" />
        <AdminInput name="b2bPrice" label={locale === "it" ? "Wholesale EUR" : "批发 EUR"} defaultValue="92.50" type="number" step="0.01" />
        <AdminInput name="stockOnHand" label="Stock" defaultValue="20" type="number" />
        <AdminInput name="incomingQty" label="Incoming" defaultValue="60" type="number" />
        <AdminInput name="imageUrl" label="Image URL" defaultValue="" required={false} />
        <AdminInput name="compatibility" label="Compatibility" defaultValue="iPhone 15 Pro, A2848, A3101" />
        <AdminTextarea name="descriptionIt" label="Description IT" defaultValue="Display compatibile per riparazioni professionali." />
        <AdminTextarea name="descriptionZh" label="中文描述" defaultValue="适合专业维修场景的兼容屏。" />
        <AdminTextarea textareaClassName="font-mono" name="attributes" label="Attributes" defaultValue={"screen_technology=soft-oled\nwith_frame=yes"} />
        <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
          {locale === "it" ? "Salva SKU" : "保存 SKU"}
        </button>
      </form>
    </AdminCollapsiblePanel>
  );
}

function BulkTool({ locale, rows }: Readonly<{ locale: Locale; rows: AdminProductRow[] }>) {
  return (
    <AdminCollapsiblePanel title={locale === "it" ? "Bulk" : "批量状态"} summary={`${rows.length} SKU`}>
      <form action="/api/admin/products/bulk" method="post" className="grid gap-2">
        <AdminCsrfField />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="ids" value={rows.map((row) => row.skuId).join(",")} />
        <AdminSelect name="action" label={locale === "it" ? "Azione" : "操作"} defaultValue="publish">
          <option value="publish">{locale === "it" ? "Pubblica" : "发布"}</option>
          <option value="archive">{locale === "it" ? "Archivia" : "下架"}</option>
        </AdminSelect>
        <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white disabled:opacity-50" type="submit" disabled={!rows.length}>
          {locale === "it" ? "Applica" : "应用"}
        </button>
      </form>
    </AdminCollapsiblePanel>
  );
}

function MiniStat({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-lg bg-stone-50 px-2 py-1.5">
      <p className="text-[10px] font-black uppercase text-stone-400">{label}</p>
      <p className="truncate text-xs font-black text-stone-950">{value}</p>
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
          ? "Demo mode: Supabase non configurato, la pagina usa dati locali."
          : "演示模式：Supabase 未配置，页面使用本地样例数据。"}
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
  query,
  locale,
}: Readonly<{
  query: Record<string, string | string[] | undefined>;
  locale: Locale;
}>) {
  const error = valueOf(query.error);
  const saved = valueOf(query.saved);
  const imported = valueOf(query.imported);
  const processed = valueOf(query.processed);
  const attributeSaved = valueOf(query.attribute);
  const translations = valueOf(query.translations);
  const translationUpdated = valueOf(query.updated);
  const translationSkipped = valueOf(query.skipped);
  const archived = valueOf(query.archived);
  const published = valueOf(query.published);
  const bulk = valueOf(query.bulk);
  return (
    <>
      {saved ? <AdminNotice tone="success">{locale === "it" ? "Prodotto salvato." : "商品已保存。"}</AdminNotice> : null}
      {error ? <AdminNotice tone="danger">{decodeURIComponent(error)}</AdminNotice> : null}
      {imported ? (
        <AdminNotice tone="info">
          {locale === "it"
            ? `Import catalogo: ${processed || "0"} righe lette, ${imported} SKU importati.`
            : `目录导入：读取 ${processed || "0"} 行，导入 ${imported} 个 SKU。`}
        </AdminNotice>
      ) : null}
      {attributeSaved ? <AdminNotice tone="success">{locale === "it" ? "Parametro salvato." : "参数已保存。"}</AdminNotice> : null}
      {translations ? (
        <AdminNotice tone="success">
          {locale === "it"
            ? `Traduzioni salvate: ${translationUpdated || "0"} aggiornate, ${translationSkipped || "0"} saltate.`
            : `目录中文翻译已保存：更新 ${translationUpdated || "0"} 条，跳过 ${translationSkipped || "0"} 条。`}
        </AdminNotice>
      ) : null}
      {archived || published || bulk ? <AdminNotice tone="success">{locale === "it" ? "Stato SKU aggiornato." : "SKU 状态已更新。"}</AdminNotice> : null}
    </>
  );
}

function filterProductRows(rows: AdminProductRow[], state: { q: string; brand: string; model: string; status: string }) {
  const query = normalizeSearch(state.q);
  return rows.filter((row) => {
    if (state.brand && row.brand !== state.brand) return false;
    if (state.model && row.model !== state.model) return false;
    if (state.status === "needs" && !(row.isActive && row.completenessIssues.some((issue) => issue !== "archived"))) return false;
    if (state.status === "published" && !row.isActive) return false;
    if (state.status === "archived" && row.isActive) return false;
    if (state.status === "missing_zh" && !row.completenessIssues.some((issue) => issue.startsWith("missing_zh"))) return false;
    if (state.status === "stock_risk" && !row.completenessIssues.includes("stock_risk")) return false;
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

function getProductFilterCounts(rows: AdminProductRow[]) {
  return {
    all: rows.length,
    needs: rows.filter((row) => row.isActive && row.completenessIssues.some((issue) => issue !== "archived")).length,
    published: rows.filter((row) => row.isActive).length,
    archived: rows.filter((row) => !row.isActive).length,
    missing_zh: rows.filter((row) => row.completenessIssues.some((issue) => issue.startsWith("missing_zh"))).length,
    stock_risk: rows.filter((row) => row.completenessIssues.includes("stock_risk")).length,
  } satisfies Record<string, number>;
}

function buildProductsHref(locale: Locale, state: { q?: string; brand?: string; model?: string; status?: string }) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.brand) params.set("brand", state.brand);
  if (state.model) params.set("model", state.model);
  if (state.status && state.status !== "all") params.set("status", state.status);
  const query = params.toString();
  return `${localizePath(locale, "/admin/products")}${query ? `?${query}` : ""}`;
}

function getUniqueOptions(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
