import {
  AlertTriangle,
  PackageCheck,
  Settings2,
  Truck,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  getInventorySettings,
  getOpenSupplierPurchaseItems,
  getSupplierPurchaseOrders,
} from "@/lib/admin-inventory";
import { getAuthContext } from "@/lib/auth";
import { getDictionary, isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

export default async function AdminInventoryPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale: rawLocale } = await params;
  const query = (await searchParams) ?? {};
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "zh";
  const dictionary = getDictionary(locale);
  const auth = await getAuthContext();
  const canLoad = !auth.configured || auth.isAdmin;
  const [settings, orders, openItems] = canLoad
    ? await Promise.all([
        getInventorySettings(),
        getSupplierPurchaseOrders(),
        getOpenSupplierPurchaseItems(),
      ])
    : [await getInventorySettings(), [], []];
  const error = valueOf(query.error);
  const imported = valueOf(query.imported);
  const processed = valueOf(query.processed);
  const skipped = valueOf(query.skipped);
  const ordered = valueOf(query.ordered);
  const received = valueOf(query.received);
  const missing = valueOf(query.missing);
  const settingsSaved = valueOf(query.settings);
  const openItemIds = openItems.map((item) => item.id).join(",");

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-violet-200 bg-violet-50 text-violet-700">
          {locale === "it" ? "Inventario" : "库存"}
        </Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {locale === "it" ? "Inventario e preordini" : "库存与预购管理"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {locale === "it"
            ? "Importa ordini fornitore, conferma arrivi, marca ammanchi e controlla le quantita prenotate."
            : "导入上游订货单、确认到货、标记缺货，并防止重复下单。"}
        </p>

        {auth.configured && !auth.isAdmin ? (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {auth.user
              ? locale === "it"
                ? "Il tuo utente non ha ruolo admin."
                : "当前用户不是 admin 角色。"
              : locale === "it"
                ? "Effettua login admin per gestire inventario reale."
                : "请使用管理员账户登录后管理真实库存。"}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertTriangle className="mr-2 inline h-4 w-4" />
            {decodeURIComponent(error)}
          </div>
        ) : null}

        {imported ? (
          <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            {locale === "it"
              ? `Import: ${imported} SKU importati, ${ordered || "0"} pezzi ordinati, ${skipped || "0"} righe saltate su ${processed || "0"}.`
              : `导入完成：${imported} 个 SKU，${ordered || "0"} 件在途，${skipped || "0"} 行跳过，共读取 ${processed || "0"} 行。`}
          </div>
        ) : null}

        {received || missing ? (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {locale === "it"
              ? `Ricezione aggiornata: ${received || "0"} ricevuti, ${missing || "0"} mancanti.`
              : `到货已更新：实收 ${received || "0"}，缺货 ${missing || "0"}。`}
          </div>
        ) : null}

        {settingsSaved ? (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {locale === "it" ? "Impostazioni salvate." : "库存设置已保存。"}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href={localizePath(locale, "/admin")} variant="secondary">
            {dictionary.nav.admin}
          </ButtonLink>
          <ButtonLink href={localizePath(locale, "/admin/products")} variant="secondary">
            {locale === "it" ? "Prodotti" : "商品"}
          </ButtonLink>
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-950">
              {locale === "it" ? "Import ordine fornitore" : "导入上游订货单"}
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {locale === "it"
              ? "Il file viene importato come merce ordinata, non come stock disponibile."
              : "文件会作为已向上游订购的在途数量导入，不会直接变成现货。"}
          </p>
          <form
            action="/api/admin/inventory/import-cart"
            encType="multipart/form-data"
            method="post"
            className="mt-4 grid gap-3"
          >
            <input type="hidden" name="locale" value={locale} />
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Excel
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                name="file"
                type="file"
                accept=".xlsx,.xls"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {locale === "it" ? "Percorso locale fallback" : "本机文件路径 fallback"}
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                name="sourcePath"
                defaultValue="/Users/kyox215/Downloads/cart (1).xlsx"
              />
            </label>
            <button
              className="h-11 rounded-lg border border-blue-600 bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
              type="submit"
            >
              {locale === "it" ? "Importa come preordine" : "作为预购在途导入"}
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-950">
              {locale === "it" ? "Impostazioni prezzi" : "库存价格设置"}
            </h2>
          </div>
          <form
            action="/api/admin/inventory/settings"
            method="post"
            className="mt-4 grid gap-3 md:grid-cols-2"
          >
            <input type="hidden" name="locale" value={locale} />
            <Input name="b2bMarkup" label="B2B x" defaultValue={String(settings.b2bMarkup)} step="0.001" />
            <Input name="retailMarkup" label="Retail x" defaultValue={String(settings.retailMarkup)} step="0.001" />
            <Input
              name="preorderLeadTimeMinDays"
              label={locale === "it" ? "Min giorni" : "最短天数"}
              defaultValue={String(settings.preorderLeadTimeMinDays)}
            />
            <Input
              name="preorderLeadTimeMaxDays"
              label={locale === "it" ? "Max giorni" : "最长天数"}
              defaultValue={String(settings.preorderLeadTimeMaxDays)}
            />
            <button
              className="h-11 rounded-lg border border-slate-900 bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800 md:col-span-2"
              type="submit"
            >
              {locale === "it" ? "Salva impostazioni" : "保存设置"}
            </button>
          </form>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-950">
              {locale === "it" ? "Conferma arrivi" : "确认到货 / 缺货"}
            </h2>
          </div>
        </div>
        {openItems.length > 0 ? (
          <form action="/api/admin/inventory/receive" method="post">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="itemIds" value={openItemIds} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">SKU / EAN</th>
                    <th className="px-4 py-3">{locale === "it" ? "Prodotto" : "商品"}</th>
                    <th className="px-4 py-3">{locale === "it" ? "Ordinato" : "已订购"}</th>
                    <th className="px-4 py-3">{locale === "it" ? "Ricevuto" : "已实收"}</th>
                    <th className="px-4 py-3">{locale === "it" ? "Mancante" : "已缺货"}</th>
                    <th className="px-4 py-3">{locale === "it" ? "Costo" : "成本"}</th>
                    <th className="px-4 py-3">{locale === "it" ? "Conferma ricevuto" : "本次实收"}</th>
                    <th className="px-4 py-3">{locale === "it" ? "Conferma mancante" : "本次缺货"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {openItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 align-top">
                        <p className="font-mono text-xs font-bold text-slate-900">
                          {item.sku}
                        </p>
                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {item.ean13}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="font-semibold text-slate-950">{item.originalName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.supplierName} / {item.status}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top font-semibold">{item.orderedQty}</td>
                      <td className="px-4 py-3 align-top">{item.receivedQty}</td>
                      <td className="px-4 py-3 align-top">{item.missingQty}</td>
                      <td className="px-4 py-3 align-top">
                        {formatMoney(item.costPrice, locale)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <SmallNumberInput
                          name={`received_${item.id}`}
                          max={item.remainingQty}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <SmallNumberInput
                          name={`missing_${item.id}`}
                          max={item.remainingQty}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-200 p-4">
              <button
                className="h-11 rounded-lg border border-emerald-600 bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
                type="submit"
              >
                {locale === "it" ? "Aggiorna inventario" : "更新库存"}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center text-sm text-slate-600">
            <PackageCheck className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 font-semibold">
              {locale === "it" ? "Nessun ordine aperto." : "暂无待确认的上游订货记录。"}
            </p>
          </div>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Batch importati" : "已导入批次"}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">{locale === "it" ? "Ordinato" : "订购"}</th>
                <th className="px-4 py-3">{locale === "it" ? "Ricevuto" : "实收"}</th>
                <th className="px-4 py-3">{locale === "it" ? "Mancante" : "缺货"}</th>
                <th className="px-4 py-3">{locale === "it" ? "Creato" : "创建时间"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-950">{order.sourceFilename}</p>
                    <p className="font-mono text-xs text-slate-500">{order.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{order.orderedTotal}</td>
                  <td className="px-4 py-3">{order.receivedTotal}</td>
                  <td className="px-4 py-3">{order.missingTotal}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(order.createdAt).toLocaleString(
                      locale === "it" ? "it-IT" : "zh-CN",
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                    {locale === "it" ? "Nessun batch importato." : "暂无导入批次。"}
                  </td>
                </tr>
              ) : null}
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
  step,
}: Readonly<{
  name: string;
  label: string;
  defaultValue: string;
  step?: string;
}>) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        defaultValue={defaultValue}
        name={name}
        step={step}
        type="number"
      />
    </label>
  );
}

function SmallNumberInput({
  name,
  max,
}: Readonly<{ name: string; max: number }>) {
  return (
    <input
      className="h-10 w-24 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      defaultValue="0"
      min="0"
      max={max}
      name={name}
      type="number"
    />
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
