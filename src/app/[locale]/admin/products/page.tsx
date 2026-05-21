import { Search } from "lucide-react";
import { cookies } from "next/headers";
import { AdminProductInlineTable } from "@/components/admin/admin-product-inline-table";
import {
  AdminButtonLink,
  AdminEmptyState,
  AdminInput,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTabs,
  StatusPill,
} from "@/components/admin/admin-ui";
import { getAdminCatalogAttributeRows } from "@/lib/admin-catalog";
import { getAdminProductRows, type AdminProductRow } from "@/lib/admin-products";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { getAuthContext } from "@/lib/auth";
import { adminCsrfCookieName } from "@/lib/admin-csrf";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

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
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get(adminCsrfCookieName)?.value ?? "";
  const canManageProducts = !auth.configured || hasAdminPermission(auth, "products:write");
  const rows = canManageProducts ? await getAdminProductRows() : [];
  const attributes = canManageProducts ? await getAdminCatalogAttributeRows() : [];
  const state = {
    q: valueOf(query.q) ?? "",
    brand: valueOf(query.brand) ?? "",
    model: valueOf(query.model) ?? "",
    status: valueOf(query.status) ?? "all",
  };
  const filteredRows = filterProductRows(rows, state);
  const hasProductQuery = Boolean(state.q || state.brand || state.model || state.status !== "all");
  const displayedRows = hasProductQuery ? filteredRows : [];
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

      <AdminPanel title={locale === "it" ? "Cerca e filtra" : "查找商品"} toolbar={<StatusPill status={`${displayedRows.length} / ${rows.length} SKU`} tone="blue" />}>
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
          <button className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700" type="submit">
            {locale === "it" ? "Cerca" : "搜索"}
          </button>
        </form>
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
        {!hasProductQuery ? (
          <AdminEmptyState
            icon={Search}
            title={locale === "it" ? "Cerca prima di modificare" : "请先搜索或筛选商品"}
            description={
              locale === "it"
                ? "Inserisci SKU, nome, brand, modello o scegli uno stato prima di caricare la tabella modificabile."
                : "输入 SKU、名称、品牌、型号，或选择状态后再加载可编辑表格。"
            }
          />
        ) : displayedRows.length ? (
          <AdminProductInlineTable
            csrfToken={csrfToken}
            locale={locale}
            returnTo={returnTo}
            rows={displayedRows}
          />
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
      {archived || published ? <AdminNotice tone="success">{locale === "it" ? "Stato SKU aggiornato." : "SKU 状态已更新。"}</AdminNotice> : null}
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
