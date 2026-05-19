import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getAdminCatalogAttributeRows } from "@/lib/admin-catalog";
import { getAuthContext } from "@/lib/auth";
import { categories, qualityStyles } from "@/lib/catalog";
import { getDictionary, isLocale, type Locale, localizePath } from "@/lib/i18n";
import { getAdminProductRows } from "@/lib/admin-products";
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
  const dictionary = getDictionary(locale);
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

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">
          {locale === "it" ? "Prodotti / SKU" : "商品 / SKU"}
        </Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {locale === "it" ? "Gestione catalogo" : "商品目录管理"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {locale === "it"
            ? "Crea SKU operativi con prezzo retail, prezzo B2B, stock e incoming. Con Supabase configurato il salvataggio scrive su products, skus e inventory."
            : "创建带零售价、B2B 价、库存和在途数量的 SKU。配置 Supabase 后会写入 products、skus 和 inventory。"}
        </p>

        {!auth.configured ? (
          <div className="mt-5 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
            {locale === "it"
              ? "Demo mode: Supabase non configurato, la tabella usa dati locali."
              : "演示模式：Supabase 未配置，表格使用本地样例数据。"}
          </div>
        ) : null}

        {auth.configured && !auth.isAdmin ? (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {auth.user
              ? locale === "it"
                ? "Il tuo utente non ha ruolo admin."
                : "当前用户不是 admin 角色。"
              : locale === "it"
                ? "Effettua login admin per gestire prodotti reali."
                : "请使用管理员账户登录后管理真实商品。"}
          </div>
        ) : null}

        {saved ? (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {saved === "demo"
              ? locale === "it"
                ? "Demo: richiesta ricevuta, configura Supabase per salvare."
                : "演示：已收到请求，配置 Supabase 后可真实保存。"
              : locale === "it"
                ? "Prodotto salvato."
                : "商品已保存。"}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {decodeURIComponent(error)}
          </div>
        ) : null}

        {imported ? (
          <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            {locale === "it"
              ? `Import catalogo: ${processed || "0"} righe lette, ${imported} SKU importati. Stato: ${importMessage || "ok"}.`
              : `目录导入：读取 ${processed || "0"} 行，导入 ${imported} 个 SKU。状态：${importMessage || "ok"}。`}
          </div>
        ) : null}

        {attributeSaved ? (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {locale === "it" ? "Parametro salvato." : "参数已保存。"}
          </div>
        ) : null}

        <div className="mt-5 flex gap-3">
          <ButtonLink href={localizePath(locale, "/admin")} variant="secondary">
            {dictionary.nav.admin}
          </ButtonLink>
          {!auth.user && auth.configured ? (
            <ButtonLink href={localizePath(locale, "/login")} variant="secondary">
              {locale === "it" ? "Login" : "登录"}
            </ButtonLink>
          ) : null}
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Import da price_*" : "从 price_* 导入"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {locale === "it"
              ? "Importa a batch i dati esistenti in products/skus. Richiede SUPABASE_SERVICE_ROLE_KEY."
              : "分批把现有 price_* 数据导入 products/skus。需要 SUPABASE_SERVICE_ROLE_KEY。"}
          </p>
          <form action="/api/admin/catalog/import" method="post" className="mt-4 flex gap-3">
            <input type="hidden" name="locale" value={locale} />
            <input
              name="batchSize"
              defaultValue="500"
              type="number"
              min="1"
              max="5000"
              className="h-11 w-28 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <button
              type="submit"
              className="h-11 rounded-lg border border-slate-900 bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800"
            >
              {locale === "it" ? "Importa batch" : "导入一批"}
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Nuovo parametro filtro" : "新建筛选参数"}
          </h2>
          <form
            action="/api/admin/catalog/attributes"
            method="post"
            className="mt-4 grid gap-3 md:grid-cols-2"
          >
            <input type="hidden" name="locale" value={locale} />
            <Input name="key" label="Key" defaultValue="screen_technology" />
            <Input name="labelIt" label="Label IT" defaultValue="Tecnologia display" />
            <Input name="labelZh" label="中文标签" defaultValue="屏幕技术" />
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Type
              <select
                name="inputType"
                defaultValue="select"
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="select">select</option>
                <option value="boolean">boolean</option>
                <option value="number">number</option>
                <option value="text">text</option>
              </select>
            </label>
            <Input name="unit" label="Unit" defaultValue="" required={false} />
            <label className="flex items-center gap-2 pt-7 text-sm font-medium text-slate-700">
              <input name="isFilterable" type="checkbox" defaultChecked />
              Filterable
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              Options
              <textarea
                name="options"
                className="min-h-24 rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                defaultValue={"soft-oled|Soft OLED|Soft OLED\nhard-oled|Hard OLED|Hard OLED"}
              />
            </label>
            <button
              className="h-11 rounded-lg border border-blue-600 bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 md:col-span-2"
              type="submit"
            >
              {locale === "it" ? "Salva parametro" : "保存参数"}
            </button>
          </form>
        </div>
      </section>

      {attributes.length > 0 ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Parametri attivi" : "当前筛选参数"}
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {attributes.map((attribute) => (
              <div key={attribute.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-mono text-xs font-bold text-slate-500">
                  {attribute.key}
                </p>
                <p className="mt-1 font-bold text-slate-950">
                  {locale === "it" ? attribute.labelIt : attribute.labelZh}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {attribute.inputType}
                  {attribute.unit ? ` / ${attribute.unit}` : ""}
                </p>
                {attribute.options.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {attribute.options.slice(0, 6).map((option) => (
                      <Badge
                        key={option.value}
                        className="border-slate-200 bg-slate-50 text-slate-700"
                      >
                        {locale === "it" ? option.labelIt : option.labelZh}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-950">
          {locale === "it" ? "Nuovo SKU" : "新建 SKU"}
        </h2>
        <form
          action="/api/admin/products"
          method="post"
          className="mt-5 grid gap-4 md:grid-cols-3"
        >
          <input type="hidden" name="locale" value={locale} />
          <Input name="slug" label="Slug" defaultValue="iphone-15-pro-soft-oled-display" />
          <Input name="sku" label="SKU" defaultValue="APL-IP15P-SCR-SO-BLK" />
          <Input name="barcodeEan13" label="EAN-13" defaultValue="" required={false} />
          <Input name="brand" label="Brand" defaultValue="Apple" />
          <Input name="model" label="Model" defaultValue="iPhone 15 Pro" />
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Category
            <select
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              name="category"
              defaultValue="screens"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label[locale]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Quality
            <select
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              name="qualityGrade"
              defaultValue="Soft OLED"
            >
              {Object.keys(qualityStyles).map((quality) => (
                <option key={quality}>{quality}</option>
              ))}
            </select>
          </label>
          <Input name="nameIt" label="Nome IT" defaultValue="Display iPhone 15 Pro Soft OLED nero" />
          <Input name="nameZh" label="中文名" defaultValue="iPhone 15 Pro Soft OLED 黑色屏幕" />
          <Input name="color" label="Color" defaultValue="Black" />
          <Input name="moq" label="MOQ" defaultValue="1" type="number" />
          <Input name="costPrice" label="Cost EUR" defaultValue="" type="number" step="0.01" required={false} />
          <Input name="retailPrice" label="Retail EUR" defaultValue="119.90" type="number" step="0.01" />
          <Input name="b2bPrice" label="B2B EUR" defaultValue="92.50" type="number" step="0.01" />
          <Input name="stockOnHand" label="Stock" defaultValue="20" type="number" />
          <Input name="incomingQty" label="Incoming" defaultValue="60" type="number" />
          <Input
            name="imageUrl"
            label="Image URL"
            defaultValue="https://images.unsplash.com/photo-1581993192008-63e896f4f744?auto=format&fit=crop&w=900&q=80"
          />
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-3">
            Compatibility
            <input
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              name="compatibility"
              defaultValue="iPhone 15 Pro, A2848, A3101"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-3">
            Description IT
            <textarea
              className="min-h-24 rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              name="descriptionIt"
              defaultValue="Display compatibile Soft OLED per riparazioni professionali."
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-3">
            中文描述
            <textarea
              className="min-h-24 rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              name="descriptionZh"
              defaultValue="适合专业维修场景的 Soft OLED 兼容屏。"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-3">
            Attributes
            <textarea
              className="min-h-24 rounded-lg border border-slate-300 p-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              name="attributes"
              defaultValue={"screen_technology=soft-oled\nwith_frame=yes\nwarranty=6-months"}
            />
          </label>
          <button
            className="h-11 rounded-lg border border-blue-600 bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 md:col-span-3"
            type="submit"
          >
            {locale === "it" ? "Salva SKU" : "保存 SKU"}
          </button>
        </form>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "SKU catalogo" : "商品 SKU 列表"}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1240px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">EAN</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Brand / Model</th>
                <th className="px-4 py-3">Quality</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Retail</th>
                <th className="px-4 py-3">B2B</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Reserved</th>
                <th className="px-4 py-3">Incoming</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">
                    {row.sku}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {row.barcodeEan13 || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-950">
                      {locale === "it" ? row.nameIt : row.nameZh}
                    </p>
                    <p className="text-xs text-slate-500">{row.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.brand} / {row.model}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={qualityStyles[row.qualityGrade as keyof typeof qualityStyles] ?? "border-slate-200 bg-slate-50 text-slate-700"}>
                      {row.qualityGrade}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {row.costPrice === null ? "-" : formatMoney(row.costPrice, locale)}
                  </td>
                  <td className="px-4 py-3">{formatMoney(row.retailPrice, locale)}</td>
                  <td className="px-4 py-3 font-semibold text-blue-700">
                    {formatMoney(row.b2bPrice, locale)}
                  </td>
                  <td className="px-4 py-3">
                    {row.stockOnHand}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.stockReserved}
                    {row.incomingReserved ? (
                      <span className="ml-1 text-xs text-violet-700">
                        / {row.incomingReserved}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-violet-700">
                      {Math.max(row.incomingQty - row.incomingReserved, 0)}
                    </span>
                    <span className="ml-1 text-xs text-slate-500">
                      / {row.incomingQty}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.isActive ? (
                      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                        Draft
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Input({
  name,
  label,
  defaultValue,
  type = "text",
  step,
  required = true,
}: Readonly<{
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
  step?: string;
  required?: boolean;
}>) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        defaultValue={defaultValue}
        name={name}
        required={required}
        step={step}
        type={type}
      />
    </label>
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
