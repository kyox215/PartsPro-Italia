import { Search } from "lucide-react";
import {
  AdminButtonLink,
  AdminDataTable,
  AdminEmptyState,
  AdminInput,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTextarea,
  StatusPill,
} from "@/components/admin/admin-ui";
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

  return (
    <div className="space-y-5">
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
      />

      <section className="grid items-start gap-5 xl:grid-cols-3">
        <AdminPanel
          title={locale === "it" ? "Import da price_*" : "从 price_* 导入"}
          description={
            locale === "it"
              ? "Importa a batch i dati esistenti in products/skus."
              : "分批把现有 price_* 数据导入 products/skus。"
          }
        >
          <form action="/api/admin/catalog/import" method="post" className="flex flex-wrap gap-3">
            <input type="hidden" name="locale" value={locale} />
            <AdminInput
              className="w-32"
              name="batchSize"
              defaultValue="500"
              type="number"
              min="1"
              max="5000"
              label="Batch"
            />
            <button
              type="submit"
              className="mt-6 h-11 rounded-lg bg-stone-950 px-4 text-sm font-black text-white transition hover:bg-stone-800"
            >
              {locale === "it" ? "Importa batch" : "导入一批"}
            </button>
          </form>
        </AdminPanel>

        <AdminPanel
          title={locale === "it" ? "Nuovo parametro filtro" : "新建筛选参数"}
          description={
            locale === "it"
              ? "Aggiungi filtri dinamici per la pagina catalogo."
              : "为目录页添加动态筛选字段。"
          }
        >
          <form
            action="/api/admin/catalog/attributes"
            method="post"
            className="grid gap-3 md:grid-cols-2"
          >
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
            <label className="flex items-center gap-2 pt-8 text-sm font-black text-stone-700">
              <input name="isFilterable" type="checkbox" defaultChecked className="h-4 w-4 accent-stone-950" />
              Filterable
            </label>
            <AdminTextarea
              className="md:col-span-2"
              name="options"
              label="Options"
              defaultValue={"soft-oled|Soft OLED|Soft OLED\nhard-oled|Hard OLED|Hard OLED"}
            />
            <button
              className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-black text-white transition hover:bg-stone-800 md:col-span-2"
              type="submit"
            >
              {locale === "it" ? "Salva parametro" : "保存参数"}
            </button>
          </form>
        </AdminPanel>

        <AdminPanel
          title={locale === "it" ? "Traduzioni cinese" : "中文商品名"}
          description={
            locale === "it"
              ? "Genera nomi cinesi senza sovrascrivere modifiche manuali."
              : "批量生成中文名，不覆盖人工修改。"
          }
        >
          <form
            action="/api/admin/catalog/translations"
            method="post"
            className="grid gap-3"
          >
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="mode" value="batch" />
            <AdminInput
              name="limit"
              defaultValue="300"
              type="number"
              min="1"
              max="1000"
              label="Limit"
            />
            <label className="flex items-center gap-2 text-sm font-black text-stone-700">
              <input name="overwrite" type="checkbox" value="true" className="h-4 w-4 accent-stone-950" />
              {locale === "it" ? "Sovrascrivi anche nomi manuali" : "覆盖人工中文名"}
            </label>
            <button
              className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-black text-white transition hover:bg-stone-800"
              type="submit"
            >
              {locale === "it" ? "Genera traduzioni" : "批量生成中文名"}
            </button>
          </form>
        </AdminPanel>
      </section>

      {attributes.length > 0 ? (
        <AdminPanel title={locale === "it" ? "Parametri attivi" : "当前筛选参数"}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {attributes.map((attribute) => (
              <div key={attribute.id} className="rounded-lg border border-black/5 bg-stone-50 p-4">
                <p className="font-mono text-xs font-black text-stone-500">
                  {attribute.key}
                </p>
                <p className="mt-1 font-black text-stone-950">
                  {locale === "it" ? attribute.labelIt : attribute.labelZh}
                </p>
                <p className="mt-1 text-xs font-semibold text-stone-500">
                  {attribute.inputType}
                  {attribute.unit ? ` / ${attribute.unit}` : ""}
                </p>
                {attribute.options.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {attribute.options.slice(0, 6).map((option) => (
                      <StatusPill
                        key={option.value}
                        status={locale === "it" ? option.labelIt : option.labelZh}
                        tone="slate"
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </AdminPanel>
      ) : null}

      <AdminPanel
        title={locale === "it" ? "Nuovo SKU" : "新建 SKU"}
        description={
          locale === "it"
            ? "Form completo per creare prodotto, SKU e record inventory."
            : "创建商品、SKU 和库存记录的完整表单。"
        }
      >
        <form
          action="/api/admin/products"
          method="post"
          className="grid gap-4 md:grid-cols-3"
        >
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
          <AdminInput
            name="imageUrl"
            label="Image URL"
            defaultValue="https://images.unsplash.com/photo-1581993192008-63e896f4f744?auto=format&fit=crop&w=900&q=80"
          />
          <AdminInput
            className="md:col-span-3"
            name="compatibility"
            label="Compatibility"
            defaultValue="iPhone 15 Pro, A2848, A3101"
          />
          <AdminTextarea
            className="md:col-span-3"
            name="descriptionIt"
            label="Description IT"
            defaultValue="Display compatibile Soft OLED per riparazioni professionali."
          />
          <AdminTextarea
            className="md:col-span-3"
            name="descriptionZh"
            label="中文描述"
            defaultValue="适合专业维修场景的 Soft OLED 兼容屏。"
          />
          <AdminTextarea
            className="md:col-span-3"
            textareaClassName="font-mono"
            name="attributes"
            label="Attributes"
            defaultValue={"screen_technology=soft-oled\nwith_frame=yes\nwarranty=6-months"}
          />
          <button
            className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-black text-white transition hover:bg-stone-800 md:col-span-3"
            type="submit"
          >
            {locale === "it" ? "Salva SKU" : "保存 SKU"}
          </button>
        </form>
      </AdminPanel>

      <AdminPanel
        title={locale === "it" ? "SKU catalogo" : "商品 SKU 列表"}
        toolbar={<StatusPill status={`${rows.length} SKU`} tone="blue" />}
      >
        {rows.length ? (
          <AdminDataTable minWidth={1680}>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-stone-400">
                <tr className="border-b border-black/5">
                  <th className="px-3 py-3">SKU</th>
                  <th className="px-3 py-3">EAN</th>
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">中文维护</th>
                  <th className="px-3 py-3">Brand / Model</th>
                  <th className="px-3 py-3">Quality</th>
                  <th className="px-3 py-3">Cost</th>
                  <th className="px-3 py-3">Retail</th>
                  <th className="px-3 py-3">B2B</th>
                  <th className="px-3 py-3">Stock</th>
                  <th className="px-3 py-3">Reserved</th>
                  <th className="px-3 py-3">Incoming</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top hover:bg-stone-50">
                    <td className="px-3 py-4 font-mono text-xs font-black text-stone-800">
                      {row.sku}
                    </td>
                    <td className="px-3 py-4 font-mono text-xs font-semibold text-stone-500">
                      {row.barcodeEan13 || "-"}
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-black text-stone-950">
                        {locale === "it" ? row.nameIt : row.nameZh}
                      </p>
                      <p className="mt-1 text-xs font-medium text-stone-500">IT: {row.nameIt}</p>
                      <p className="mt-1 text-xs font-medium text-stone-500">ZH: {row.nameZh}</p>
                      <p className="mt-1 text-xs font-medium text-stone-400">{row.slug}</p>
                    </td>
                    <td className="px-3 py-4">
                      <form
                        action="/api/admin/catalog/translations"
                        method="post"
                        className="grid min-w-[260px] gap-2"
                      >
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
                    <td className="px-3 py-4 font-semibold text-stone-700">
                      {row.brand} / {row.model}
                    </td>
                    <td className="px-3 py-4">
                      <StatusPill status={row.qualityGrade} tone="slate" />
                    </td>
                    <td className="px-3 py-4">
                      {row.costPrice === null ? "-" : formatMoney(row.costPrice, locale)}
                    </td>
                    <td className="px-3 py-4">{formatMoney(row.retailPrice, locale)}</td>
                    <td className="px-3 py-4 font-black text-sky-700">
                      {formatMoney(row.b2bPrice, locale)}
                    </td>
                    <td className="px-3 py-4 font-black text-stone-950">
                      {row.stockOnHand}
                    </td>
                    <td className="px-3 py-4 text-stone-700">
                      {row.stockReserved}
                      {row.incomingReserved ? (
                        <span className="ml-1 text-xs font-black text-violet-700">
                          / {row.incomingReserved}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-4">
                      <span className="font-black text-violet-700">
                        {Math.max(row.incomingQty - row.incomingReserved, 0)}
                      </span>
                      <span className="ml-1 text-xs font-semibold text-stone-500">
                        / {row.incomingQty}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <StatusPill status={row.isActive ? "Active" : "Draft"} />
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
    </>
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
