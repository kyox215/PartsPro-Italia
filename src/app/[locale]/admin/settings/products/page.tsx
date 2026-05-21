import { AdminCsrfField } from "@/components/admin/admin-csrf-field";
import {
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/admin-ui";
import { categories, qualityStyles } from "@/lib/catalog";
import { isLocale, type Locale } from "@/lib/i18n";

export default async function AdminProductSettingsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "zh";

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Product tools" : "商品设置"}
        title={locale === "it" ? "Strumenti catalogo" : "商品高级工具"}
        description={
          locale === "it"
            ? "Import, creazione SKU, traduzioni e parametri catalogo."
            : "导入、新建 SKU、中文翻译和商品筛选参数集中在这里。"
        }
      />

      <div className="grid gap-3 xl:grid-cols-2">
        <AdminPanel title={locale === "it" ? "Import price_*" : "导入 price_*"}>
          <form action="/api/admin/catalog/import" method="post" className="flex flex-wrap items-end gap-2">
            <AdminCsrfField />
            <input type="hidden" name="locale" value={locale} />
            <AdminInput className="w-36" name="batchSize" defaultValue="500" type="number" min="1" max="5000" label="Batch" />
            <button type="submit" className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-black text-white hover:bg-blue-700">
              {locale === "it" ? "Importa" : "导入"}
            </button>
          </form>
        </AdminPanel>

        <AdminPanel title={locale === "it" ? "Traduzioni ZH" : "批量中文翻译"}>
          <form action="/api/admin/catalog/translations" method="post" className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <AdminCsrfField />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="mode" value="batch" />
            <AdminInput name="limit" defaultValue="300" type="number" min="1" max="1000" label="Limit" />
            <button className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-black text-white hover:bg-blue-700" type="submit">
              {locale === "it" ? "Genera" : "生成"}
            </button>
          </form>
        </AdminPanel>

        <AdminPanel title={locale === "it" ? "Nuovo SKU" : "新建 SKU"}>
          <form action="/api/admin/products" method="post" className="grid gap-2 md:grid-cols-2">
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
            <AdminInput name="moq" label="MOQ" defaultValue="1" type="number" />
            <AdminInput name="retailPrice" label="Retail EUR" defaultValue="119.90" type="number" step="0.01" />
            <AdminInput name="b2bPrice" label={locale === "it" ? "Wholesale EUR" : "批发 EUR"} defaultValue="92.50" type="number" step="0.01" />
            <AdminInput name="stockOnHand" label="Stock" defaultValue="20" type="number" />
            <AdminInput name="incomingQty" label="Incoming" defaultValue="60" type="number" />
            <AdminInput name="barcodeEan13" label="EAN-13" defaultValue="" required={false} />
            <AdminInput name="color" label="Color" defaultValue="Black" />
            <AdminInput name="costPrice" label="Cost EUR" defaultValue="" type="number" step="0.01" required={false} />
            <AdminInput name="imageUrl" label="Image URL" defaultValue="" required={false} />
            <AdminInput className="md:col-span-2" name="compatibility" label="Compatibility" defaultValue="iPhone 15 Pro, A2848, A3101" />
            <AdminTextarea className="md:col-span-2" name="descriptionIt" label="Description IT" defaultValue="Display compatibile per riparazioni professionali." />
            <AdminTextarea className="md:col-span-2" name="descriptionZh" label="中文描述" defaultValue="适合专业维修场景的兼容屏。" />
            <AdminTextarea className="md:col-span-2" textareaClassName="font-mono" name="attributes" label="Attributes" defaultValue={"screen_technology=soft-oled\nwith_frame=yes"} />
            <button className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-black text-white hover:bg-blue-700 md:col-span-2" type="submit">
              {locale === "it" ? "Salva SKU" : "保存 SKU"}
            </button>
          </form>
        </AdminPanel>

        <AdminPanel title={locale === "it" ? "Parametro filtro" : "筛选参数"}>
          <form action="/api/admin/catalog/attributes" method="post" className="grid gap-2 md:grid-cols-2">
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
            <AdminTextarea className="md:col-span-2" name="options" label="Options" defaultValue={"soft-oled|Soft OLED|Soft OLED\nhard-oled|Hard OLED|Hard OLED"} />
            <button className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-black text-white hover:bg-blue-700 md:col-span-2" type="submit">
              {locale === "it" ? "Salva" : "保存"}
            </button>
          </form>
        </AdminPanel>
      </div>
    </div>
  );
}
