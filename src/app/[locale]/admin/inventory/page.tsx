import {
  AlertTriangle,
  Boxes,
  PackageCheck,
  Settings2,
  Truck,
  Upload,
} from "lucide-react";
import {
  AdminButtonLink,
  AdminDataTable,
  AdminEmptyState,
  AdminInput,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  StatusPill,
} from "@/components/admin/admin-ui";
import {
  getInventorySettings,
  getOpenSupplierPurchaseItems,
  getSupplierPurchaseOrders,
} from "@/lib/admin-inventory";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
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
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
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
  const openQty = openItems.reduce((sum, item) => sum + item.remainingQty, 0);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Inventory components" : "库存组件"}
        title={locale === "it" ? "Inventario e preordini" : "库存与预购管理"}
        description={
          locale === "it"
            ? "Importa ordini fornitore, conferma arrivi, marca ammanchi e controlla le quantita prenotate."
            : "导入上游订货单、确认到货、标记缺货，并防止重复下单。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin")} variant="secondary">
              {locale === "it" ? "Dashboard" : "后台首页"}
            </AdminButtonLink>
            <AdminButtonLink href={localizePath(locale, "/admin/products")} variant="secondary">
              {locale === "it" ? "Prodotti" : "商品"}
            </AdminButtonLink>
          </>
        }
      />

      <SystemNotice authConfigured={auth.configured} isAdmin={auth.isAdmin} hasUser={Boolean(auth.user)} locale={locale} />
      <Feedback
        locale={locale}
        error={error}
        imported={imported}
        processed={processed}
        skipped={skipped}
        ordered={ordered}
        received={received}
        missing={missing}
        settingsSaved={settingsSaved}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <AdminMetricCard
          icon={Truck}
          label={locale === "it" ? "Righe aperte" : "待确认行"}
          value={openItems.length}
          tone="blue"
          caption={locale === "it" ? "Da ricevere" : "待到货"}
        />
        <AdminMetricCard
          icon={Boxes}
          label={locale === "it" ? "Quantita aperta" : "待确认数量"}
          value={openQty}
          tone="amber"
          caption={locale === "it" ? "Remaining" : "剩余"}
        />
        <AdminMetricCard
          icon={PackageCheck}
          label={locale === "it" ? "Batch importati" : "已导入批次"}
          value={orders.length}
          tone="green"
          caption={locale === "it" ? "Purchase orders" : "上游订单"}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <AdminPanel
          title={locale === "it" ? "Import ordine fornitore" : "导入上游订货单"}
          description={
            locale === "it"
              ? "Il file viene importato come merce ordinata, non come stock disponibile."
              : "文件会作为已向上游订购的在途数量导入，不会直接变成现货。"
          }
          toolbar={<Upload className="h-5 w-5 text-stone-500" />}
        >
          <form
            action="/api/admin/inventory/import-cart"
            encType="multipart/form-data"
            method="post"
            className="grid gap-3"
          >
            <input type="hidden" name="locale" value={locale} />
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-stone-500">
                Excel
              </span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-stone-700"
                name="file"
                type="file"
                accept=".xlsx,.xls"
              />
            </label>
            <AdminInput
              name="sourcePath"
              label={locale === "it" ? "Percorso locale fallback" : "本机文件路径 fallback"}
              defaultValue="/Users/kyox215/Downloads/cart (1).xlsx"
            />
            <button
              className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-black text-white transition hover:bg-stone-800"
              type="submit"
            >
              {locale === "it" ? "Importa come preordine" : "作为预购在途导入"}
            </button>
          </form>
        </AdminPanel>

        <AdminPanel
          title={locale === "it" ? "Impostazioni prezzi" : "库存价格设置"}
          description={
            locale === "it"
              ? "Markup e lead time usati dalle importazioni fornitore."
              : "导入上游订单时使用的加价和交期。"
          }
          toolbar={<Settings2 className="h-5 w-5 text-stone-500" />}
        >
          <form
            action="/api/admin/inventory/settings"
            method="post"
            className="grid gap-3 md:grid-cols-2"
          >
            <input type="hidden" name="locale" value={locale} />
            <AdminInput name="b2bMarkup" label="B2B x" defaultValue={String(settings.b2bMarkup)} step="0.001" type="number" />
            <AdminInput name="retailMarkup" label="Retail x" defaultValue={String(settings.retailMarkup)} step="0.001" type="number" />
            <AdminInput
              name="preorderLeadTimeMinDays"
              label={locale === "it" ? "Min giorni" : "最短天数"}
              defaultValue={String(settings.preorderLeadTimeMinDays)}
              type="number"
            />
            <AdminInput
              name="preorderLeadTimeMaxDays"
              label={locale === "it" ? "Max giorni" : "最长天数"}
              defaultValue={String(settings.preorderLeadTimeMaxDays)}
              type="number"
            />
            <button
              className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-black text-white transition hover:bg-stone-800 md:col-span-2"
              type="submit"
            >
              {locale === "it" ? "Salva impostazioni" : "保存设置"}
            </button>
          </form>
        </AdminPanel>
      </section>

      <AdminPanel
        title={locale === "it" ? "Conferma arrivi" : "确认到货 / 缺货"}
        description={
          locale === "it"
            ? "Aggiorna lo stock solo dopo ricezione effettiva."
            : "只有实际到货后才更新现货库存。"
        }
        toolbar={<Truck className="h-5 w-5 text-stone-500" />}
      >
        {openItems.length > 0 ? (
          <form action="/api/admin/inventory/receive" method="post">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="itemIds" value={openItemIds} />
            <AdminDataTable minWidth={1040}>
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-stone-400">
                  <tr className="border-b border-black/5">
                    <th className="px-3 py-3">SKU / EAN</th>
                    <th className="px-3 py-3">{locale === "it" ? "Prodotto" : "商品"}</th>
                    <th className="px-3 py-3">{locale === "it" ? "Ordinato" : "已订购"}</th>
                    <th className="px-3 py-3">{locale === "it" ? "Ricevuto" : "已实收"}</th>
                    <th className="px-3 py-3">{locale === "it" ? "Mancante" : "已缺货"}</th>
                    <th className="px-3 py-3">{locale === "it" ? "Costo" : "成本"}</th>
                    <th className="px-3 py-3">{locale === "it" ? "Conferma ricevuto" : "本次实收"}</th>
                    <th className="px-3 py-3">{locale === "it" ? "Conferma mancante" : "本次缺货"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {openItems.map((item) => (
                    <tr key={item.id} className="align-top hover:bg-stone-50">
                      <td className="px-3 py-4">
                        <p className="font-mono text-xs font-black text-stone-900">
                          {item.sku}
                        </p>
                        <p className="mt-1 font-mono text-xs font-semibold text-stone-500">
                          {item.ean13}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        <p className="font-black text-stone-950">{item.originalName}</p>
                        <p className="mt-1 text-xs font-semibold text-stone-500">
                          {item.supplierName} / {item.status}
                        </p>
                      </td>
                      <td className="px-3 py-4 font-black">{item.orderedQty}</td>
                      <td className="px-3 py-4">{item.receivedQty}</td>
                      <td className="px-3 py-4">{item.missingQty}</td>
                      <td className="px-3 py-4">{formatMoney(item.costPrice, locale)}</td>
                      <td className="px-3 py-4">
                        <SmallNumberInput name={`received_${item.id}`} max={item.remainingQty} />
                      </td>
                      <td className="px-3 py-4">
                        <SmallNumberInput name={`missing_${item.id}`} max={item.remainingQty} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminDataTable>
            <div className="mt-4 border-t border-black/5 pt-4">
              <button
                className="h-11 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700"
                type="submit"
              >
                {locale === "it" ? "Aggiorna inventario" : "更新库存"}
              </button>
            </div>
          </form>
        ) : (
          <AdminEmptyState
            icon={PackageCheck}
            title={locale === "it" ? "Nessun ordine aperto" : "暂无待确认记录"}
            description={
              locale === "it"
                ? "Importa un ordine fornitore per iniziare."
                : "导入上游订货单后即可确认到货。"
            }
          />
        )}
      </AdminPanel>

      <AdminPanel title={locale === "it" ? "Batch importati" : "已导入批次"}>
        {orders.length ? (
          <AdminDataTable minWidth={760}>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-stone-400">
                <tr className="border-b border-black/5">
                  <th className="px-3 py-3">File</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">{locale === "it" ? "Ordinato" : "订购"}</th>
                  <th className="px-3 py-3">{locale === "it" ? "Ricevuto" : "实收"}</th>
                  <th className="px-3 py-3">{locale === "it" ? "Mancante" : "缺货"}</th>
                  <th className="px-3 py-3">{locale === "it" ? "Creato" : "创建时间"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50">
                    <td className="px-3 py-4">
                      <p className="font-black text-stone-950">{order.sourceFilename}</p>
                      <p className="mt-1 font-mono text-xs font-semibold text-stone-500">
                        {order.id}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <StatusPill status={order.status} />
                    </td>
                    <td className="px-3 py-4">{order.orderedTotal}</td>
                    <td className="px-3 py-4">{order.receivedTotal}</td>
                    <td className="px-3 py-4">{order.missingTotal}</td>
                    <td className="px-3 py-4 text-stone-600">
                      {new Date(order.createdAt).toLocaleString(
                        locale === "it" ? "it-IT" : "zh-CN",
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminDataTable>
        ) : (
          <AdminEmptyState
            icon={Boxes}
            title={locale === "it" ? "Nessun batch importato" : "暂无导入批次"}
            description={
              locale === "it"
                ? "I batch caricati dal carrello fornitore appariranno qui."
                : "从上游购物车导入的批次会显示在这里。"
            }
          />
        )}
      </AdminPanel>
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
  error,
  imported,
  processed,
  skipped,
  ordered,
  received,
  missing,
  settingsSaved,
}: Readonly<{
  locale: Locale;
  error?: string;
  imported?: string;
  processed?: string;
  skipped?: string;
  ordered?: string;
  received?: string;
  missing?: string;
  settingsSaved?: string;
}>) {
  return (
    <>
      {error ? (
        <AdminNotice tone="danger" title={<AlertTriangle className="h-4 w-4" />}>
          {decodeURIComponent(error)}
        </AdminNotice>
      ) : null}

      {imported ? (
        <AdminNotice tone="info">
          {locale === "it"
            ? `Import: ${imported} SKU importati, ${ordered || "0"} pezzi ordinati, ${skipped || "0"} righe saltate su ${processed || "0"}.`
            : `导入完成：${imported} 个 SKU，${ordered || "0"} 件在途，${skipped || "0"} 行跳过，共读取 ${processed || "0"} 行。`}
        </AdminNotice>
      ) : null}

      {received || missing ? (
        <AdminNotice tone="success">
          {locale === "it"
            ? `Ricezione aggiornata: ${received || "0"} ricevuti, ${missing || "0"} mancanti.`
            : `到货已更新：实收 ${received || "0"}，缺货 ${missing || "0"}。`}
        </AdminNotice>
      ) : null}

      {settingsSaved ? (
        <AdminNotice tone="success">
          {locale === "it" ? "Impostazioni salvate." : "库存设置已保存。"}
        </AdminNotice>
      ) : null}
    </>
  );
}

function SmallNumberInput({ name, max }: Readonly<{ name: string; max: number }>) {
  return (
    <input
      className="h-10 w-24 rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold outline-none focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10"
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
