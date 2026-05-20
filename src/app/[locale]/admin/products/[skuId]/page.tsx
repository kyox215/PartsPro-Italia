import { notFound } from "next/navigation";
import { Archive, CheckCircle2, PackageCheck, Save } from "lucide-react";
import { AdminCsrfField } from "@/components/admin/admin-csrf-field";
import {
  AdminActionRail,
  AdminButtonLink,
  AdminInput,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTextarea,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import { getAdminProductDetail } from "@/lib/admin-products";
import { getAuthContext } from "@/lib/auth";
import { categories, qualityStyles } from "@/lib/catalog";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

export default async function AdminProductDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string; skuId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale: rawLocale, skuId: rawSkuId } = await params;
  const query = (await searchParams) ?? {};
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const auth = await getAuthContext();
  const skuId = decodeURIComponent(rawSkuId);
  const product = !auth.configured || auth.isAdmin ? await getAdminProductDetail(skuId) : null;

  if (!product) notFound();

  const returnTo = localizePath(locale, `/admin/products/${product.skuId}`);
  const attributesText = product.attributes
    .map((attribute) => `${attribute.key}=${attribute.value}`)
    .join("\n");

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "SKU detail" : "SKU 详情"}
        title={<span className="break-all font-mono">{product.sku}</span>}
        description={
          locale === "it"
            ? "Modifica dati catalogo, traduzioni, prezzi e stato di pubblicazione. Lo stock resta solo lettura."
            : "维护商品信息、中文、价格和发布状态。库存只读，变更需走库存模块。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin/products")} variant="secondary">
              {locale === "it" ? "Catalogo" : "商品列表"}
            </AdminButtonLink>
            <AdminButtonLink href={localizePath(locale, "/admin/inventory")} variant="secondary">
              {locale === "it" ? "Inventario" : "库存"}
            </AdminButtonLink>
          </>
        }
      />

      <Feedback query={query} locale={locale} />

      <AdminWorkspaceGrid
        rail={
          <AdminActionRail
            title={locale === "it" ? "Stato SKU" : "SKU 状态"}
            description={locale === "it" ? "Pubblicazione e rischi" : "发布与运营风险"}
          >
            <AdminPanel title={locale === "it" ? "Pubblicazione" : "发布状态"}>
              <div className="grid gap-2">
                <StatusPill status={product.isActive ? "Published" : "Archived"} tone={product.isActive ? "green" : "slate"} />
                <form action="/api/admin/products/publish" method="post">
                  <AdminCsrfField />
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="productId" value={product.productId} />
                  <input type="hidden" name="skuId" value={product.skuId} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white transition hover:bg-emerald-700" type="submit">
                    <CheckCircle2 className="h-4 w-4" />
                    {locale === "it" ? "Pubblica" : "发布"}
                  </button>
                </form>
                <form action="/api/admin/products/archive" method="post">
                  <AdminCsrfField />
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="productId" value={product.productId} />
                  <input type="hidden" name="skuId" value={product.skuId} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-700 transition hover:border-rose-300" type="submit">
                    <Archive className="h-4 w-4" />
                    {locale === "it" ? "Archivia" : "下架"}
                  </button>
                </form>
              </div>
            </AdminPanel>

            <AdminPanel title={locale === "it" ? "Inventario read-only" : "库存只读"}>
              <div className="grid gap-2 text-xs font-semibold text-stone-600">
                <MetricLine label="Stock" value={`${product.stockOnHand} / reserved ${product.stockReserved}`} />
                <MetricLine label="Incoming" value={`${product.incomingQty} / reserved ${product.incomingReserved}`} />
                <MetricLine label="Reorder" value={`${product.reorderPoint} / safety ${product.safetyStock}`} />
              </div>
              <div className="mt-3">
                <AdminButtonLink href={localizePath(locale, "/admin/inventory")} variant="secondary">
                  {locale === "it" ? "Vai a inventario" : "去库存调整"}
                </AdminButtonLink>
              </div>
            </AdminPanel>

            <AdminPanel title={locale === "it" ? "Checklist" : "完善队列"}>
              <div className="flex flex-wrap gap-1">
                {product.completenessIssues.length ? (
                  product.completenessIssues.map((issue) => (
                    <StatusPill key={issue} status={issue} tone="amber" />
                  ))
                ) : (
                  <StatusPill status={locale === "it" ? "Completo" : "已完善"} tone="green" />
                )}
              </div>
            </AdminPanel>
          </AdminActionRail>
        }
      >
        <AdminPanel
          title={locale === "it" ? "Modifica SKU" : "编辑 SKU"}
          description={
            locale === "it"
              ? "Salva solo catalogo e prezzo; non modifica stock fisico."
              : "这里只保存商品目录和价格，不改实物库存。"
          }
        >
          <form action="/api/admin/products/update" method="post" className="grid gap-3">
            <AdminCsrfField />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="productId" value={product.productId} />
            <input type="hidden" name="skuId" value={product.skuId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <div className="grid gap-3 md:grid-cols-3">
              <AdminInput name="slug" label="Slug" defaultValue={product.slug} />
              <AdminInput name="sku" label="SKU" defaultValue={product.sku} />
              <AdminInput name="barcodeEan13" label="EAN-13" defaultValue={product.barcodeEan13 ?? ""} required={false} />
              <AdminInput name="brand" label="Brand" defaultValue={product.brand} />
              <AdminInput name="model" label="Model" defaultValue={product.model} />
              <AdminSelect name="category" label="Category" defaultValue={product.category}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label[locale]}
                  </option>
                ))}
              </AdminSelect>
              <AdminSelect name="qualityGrade" label="Quality" defaultValue={product.qualityGrade}>
                {Object.keys(qualityStyles).map((quality) => (
                  <option key={quality}>{quality}</option>
                ))}
              </AdminSelect>
              <AdminInput name="color" label="Color" defaultValue={product.color ?? ""} required={false} />
              <AdminInput name="moq" label="MOQ" defaultValue={String(product.moq)} type="number" />
              <AdminInput name="costPrice" label="Cost EUR" defaultValue={product.costPrice === null ? "" : String(product.costPrice)} type="number" step="0.01" required={false} />
              <AdminInput name="retailPrice" label="Retail EUR" defaultValue={String(product.retailPrice)} type="number" step="0.01" />
              <AdminInput name="b2bPrice" label={locale === "it" ? "Wholesale EUR" : "批发 EUR"} defaultValue={String(product.b2bPrice)} type="number" step="0.01" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <AdminInput name="nameIt" label="Nome IT" defaultValue={product.nameIt} />
              <AdminInput name="nameZh" label="中文名" defaultValue={product.nameZh} />
              <AdminInput className="md:col-span-2" name="imageUrl" label="Image URL" defaultValue={product.imageUrl ?? ""} required={false} />
              <AdminInput className="md:col-span-2" name="compatibility" label="Compatibility" defaultValue={product.compatibility.join(", ")} required={false} />
              <AdminTextarea name="descriptionIt" label="Description IT" defaultValue={product.descriptionIt ?? ""} />
              <AdminTextarea name="descriptionZh" label="中文描述" defaultValue={product.descriptionZh ?? ""} />
              <AdminTextarea textareaClassName="font-mono" name="attributes" label="Attributes" defaultValue={attributesText} />
            </div>
            <button className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-lg bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800" type="submit">
              <Save className="h-4 w-4" />
              {locale === "it" ? "Salva modifiche" : "保存修改"}
            </button>
          </form>
        </AdminPanel>

        <AdminPanel
          title={locale === "it" ? "Riepilogo commerciale" : "商业摘要"}
          toolbar={<PackageCheck className="h-4 w-4 text-stone-500" />}
        >
          <div className="grid gap-2 md:grid-cols-4">
            <SummaryTile label="Retail" value={formatMoney(product.retailPrice, locale)} />
            <SummaryTile label={locale === "it" ? "Wholesale" : "批发"} value={formatMoney(product.b2bPrice, locale)} />
            <SummaryTile label="Cost" value={product.costPrice === null ? "-" : formatMoney(product.costPrice, locale)} />
            <SummaryTile label="Attrs" value={String(product.attributeCount)} />
          </div>
        </AdminPanel>
      </AdminWorkspaceGrid>
    </div>
  );
}

function MetricLine({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2">
      <span>{label}</span>
      <span className="font-black text-stone-950">{value}</span>
    </div>
  );
}

function SummaryTile({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-lg bg-stone-50 p-3">
      <p className="text-[11px] font-black uppercase text-stone-400">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-stone-950">{value}</p>
    </div>
  );
}

function Feedback({
  query,
  locale,
}: Readonly<{ query: Record<string, string | string[] | undefined>; locale: Locale }>) {
  const error = valueOf(query.error);
  if (error) return <AdminNotice tone="danger">{decodeURIComponent(error)}</AdminNotice>;
  if (valueOf(query.saved)) {
    return (
      <AdminNotice tone="success">
        {locale === "it" ? "SKU salvato." : "SKU 已保存。"}
      </AdminNotice>
    );
  }
  if (valueOf(query.archived)) {
    return <AdminNotice tone="success">{locale === "it" ? "SKU archiviato." : "SKU 已下架。"}</AdminNotice>;
  }
  if (valueOf(query.published)) {
    return <AdminNotice tone="success">{locale === "it" ? "SKU pubblicato." : "SKU 已发布。"}</AdminNotice>;
  }
  return null;
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
