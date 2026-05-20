import { notFound } from "next/navigation";
import { Boxes, ClipboardList, CreditCard, PackageCheck, TimerReset } from "lucide-react";
import { StatusSelectForm } from "@/components/admin/status-select-form";
import {
  AdminButtonLink,
  AdminDataTable,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  StatusPill,
} from "@/components/admin/admin-ui";
import { getAdminOrderById } from "@/lib/admin-operations";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

const orderStatuses = [
  "draft",
  "checkout_created",
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
];

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string; orderId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale: rawLocale, orderId: rawOrderId } = await params;
  const query = (await searchParams) ?? {};
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const orderId = decodeURIComponent(rawOrderId);
  const auth = await getAuthContext();
  const order = !auth.configured || auth.isAdmin ? await getAdminOrderById(orderId) : null;

  if (!order) {
    notFound();
  }

  const returnTo = localizePath(locale, `/admin/orders/${order.id}`);
  const stockQty = order.items.reduce((sum, item) => sum + (item.stockQty ?? 0), 0);
  const preorderQty = order.items.reduce(
    (sum, item) => sum + (item.preorderQty ?? 0),
    0,
  );

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Order detail" : "订单详情"}
        title={<span className="break-all font-mono">{order.id}</span>}
        description={
          locale === "it"
            ? "Dettaglio operativo con pagamento, cliente, righe SKU e fulfilment stock/preorder."
            : "后台订单处理详情，包含付款、客户、SKU 明细和现货/预购履约。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin/orders")} variant="secondary">
              {locale === "it" ? "Torna ordini" : "返回订单"}
            </AdminButtonLink>
            <AdminButtonLink href={localizePath(locale, "/admin/inventory")} variant="secondary">
              {locale === "it" ? "Inventario" : "库存"}
            </AdminButtonLink>
          </>
        }
      />
      <Feedback saved={valueOf(query.saved)} error={valueOf(query.error)} locale={locale} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminMetricCard icon={ClipboardList} label={locale === "it" ? "Stato" : "状态"} value={<StatusPill status={order.status} />} tone="blue" />
        <AdminMetricCard
          icon={CreditCard}
          label={locale === "it" ? "Pagamento" : "付款"}
          value={order.paymentMethod}
          tone="amber"
          trend={<StatusPill status={order.paymentStatus ?? "-"} />}
        />
        <AdminMetricCard icon={Boxes} label={locale === "it" ? "Totale" : "总额"} value={formatMoney(order.total, locale)} tone="green" />
        <AdminMetricCard icon={PackageCheck} label={locale === "it" ? "Stock" : "现货履约"} value={stockQty} tone="slate" />
        <AdminMetricCard
          icon={TimerReset}
          label={locale === "it" ? "Preorder" : "预购履约"}
          value={preorderQty}
          tone="violet"
          trend={order.fulfillmentStatus ? <StatusPill status={order.fulfillmentStatus} /> : null}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <AdminPanel title={locale === "it" ? "Cliente e fattura" : "客户与发票"}>
          <dl className="grid gap-3 text-sm">
            <InfoRow label="Company" value={order.companyName || "-"} />
            <InfoRow label="Customer" value={order.customerName || "-"} />
            <InfoRow label="Email" value={order.email || "-"} />
            <InfoRow label="VAT" value={order.vatNumber || "-"} />
            <InfoRow label="Fiscal code" value={order.fiscalCode || "-"} />
            <InfoRow label="SDI / PEC" value={[order.sdi, order.pec].filter(Boolean).join(" / ") || "-"} />
            <InfoRow label="Shipping" value={order.shippingAddress || "-"} />
          </dl>
        </AdminPanel>

        <AdminPanel
          title={locale === "it" ? "Aggiorna stato" : "更新状态"}
          description={
            locale === "it"
              ? "Lo stato si aggiorna su Supabase quando la service role key e configurata."
              : "配置 service role key 后，这里会直接更新 Supabase 真实订单状态。"
          }
        >
          <StatusSelectForm
            action="/api/admin/orders/status"
            currentStatus={order.status}
            extraFields={<input type="hidden" name="returnTo" value={returnTo} />}
            id={order.id}
            locale={locale}
            statuses={orderStatuses}
          />
          <div className="mt-5 rounded-lg bg-stone-50 p-4 text-sm font-semibold text-stone-700">
            <p>
              {locale === "it" ? "Subtotal" : "小计"}:{" "}
              <strong>{formatMoney(order.subtotal ?? 0, locale)}</strong>
            </p>
            <p className="mt-2">
              IVA/VAT: <strong>{formatMoney(order.vat ?? 0, locale)}</strong>
            </p>
            {order.reservationExpiresAt ? (
              <p className="mt-2">
                {locale === "it" ? "Lock fino a" : "锁库到"}:{" "}
                <strong>
                  {new Date(order.reservationExpiresAt).toLocaleString(
                    locale === "it" ? "it-IT" : "zh-CN",
                  )}
                </strong>
              </p>
            ) : null}
          </div>
        </AdminPanel>
      </section>

      <AdminPanel
        title={locale === "it" ? "Azioni operative" : "订单闭环操作"}
        description={
          locale === "it"
            ? "Conferma incasso, assegna preorder arrivati, prepara, spedisce o annulla liberando lo stock."
            : "用于确认收款、分配已到货预购、备货、发货/自提完成，或取消并释放锁定库存。"
        }
      >
        <div className="flex flex-wrap gap-2">
          {order.paymentMethod === "cash" && order.paymentStatus === "pending_cash" ? (
            <ActionForm action="/api/admin/orders/payment" id={order.id} locale={locale} returnTo={returnTo} value="confirm_cash">
              {locale === "it" ? "Conferma contanti" : "确认现金收款"}
            </ActionForm>
          ) : null}
          {order.paymentMethod === "bank_transfer" &&
          order.paymentStatus === "pending_bank_transfer" ? (
            <ActionForm action="/api/admin/orders/payment" id={order.id} locale={locale} returnTo={returnTo} value="confirm_bank_transfer">
              {locale === "it" ? "Conferma bonifico" : "确认转账到账"}
            </ActionForm>
          ) : null}
          <ActionForm action="/api/admin/orders/fulfillment" id={order.id} locale={locale} returnTo={returnTo} value="start_picking">
            {locale === "it" ? "Inizia picking" : "开始备货"}
          </ActionForm>
          {preorderQty > 0 ? (
            <ActionForm action="/api/admin/orders/allocate-preorders" id={order.id} locale={locale} returnTo={returnTo}>
              {locale === "it" ? "Alloca preorder" : "分配预购到货"}
            </ActionForm>
          ) : null}
          <ActionForm action="/api/admin/orders/fulfillment" id={order.id} locale={locale} returnTo={returnTo} value="mark_shipped">
            {locale === "it" ? "Segna spedito" : "标记发货"}
          </ActionForm>
          <ActionForm action="/api/admin/orders/fulfillment" id={order.id} locale={locale} returnTo={returnTo} value="mark_picked_up">
            {locale === "it" ? "Ritiro completato" : "已自提完成"}
          </ActionForm>
          <ActionForm action="/api/admin/orders/fulfillment" id={order.id} locale={locale} returnTo={returnTo} value="complete">
            {locale === "it" ? "Completa" : "完成订单"}
          </ActionForm>
          <ActionForm action="/api/admin/orders/extend-reservation" id={order.id} locale={locale} returnTo={returnTo} variant="secondary">
            {locale === "it" ? "Estendi 24h" : "延长锁库 24 小时"}
          </ActionForm>
          <ActionForm action="/api/admin/orders/release" id={order.id} locale={locale} returnTo={returnTo} variant="danger">
            {locale === "it" ? "Annulla e libera" : "取消并释放库存"}
          </ActionForm>
        </div>
      </AdminPanel>

      <AdminPanel
        title={locale === "it" ? "Righe e fulfilment" : "商品与履约"}
        description={new Date(order.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}
      >
        <AdminDataTable minWidth={940}>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-stone-400">
              <tr className="border-b border-black/5">
                <th className="px-3 py-3">SKU</th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Qty</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Preorder</th>
                <th className="px-3 py-3">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {order.items.map((item) => (
                <tr key={`${order.id}-${item.sku}`} className="hover:bg-stone-50">
                  <td className="px-3 py-4 font-mono text-xs font-black text-stone-900">
                    {item.sku}
                  </td>
                  <td className="px-3 py-4 font-semibold text-stone-700">{item.name}</td>
                  <td className="px-3 py-4 font-black text-stone-950">{item.quantity}</td>
                  <td className="px-3 py-4">{item.stockQty ?? 0}</td>
                  <td className="px-3 py-4">
                    <span>{item.preorderQty ?? 0}</span>
                    {item.preorderQty &&
                    item.preorderLeadTimeMinDays &&
                    item.preorderLeadTimeMaxDays ? (
                      <span className="ml-2 text-xs font-semibold text-stone-500">
                        {item.preorderLeadTimeMinDays}-{item.preorderLeadTimeMaxDays}d
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-4 font-black text-stone-950">
                    {formatMoney(item.unitPrice * item.quantity, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminDataTable>
      </AdminPanel>
    </div>
  );
}

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid gap-1 rounded-lg bg-stone-50 p-3 sm:grid-cols-[120px_1fr]">
      <dt className="font-black text-stone-500">{label}</dt>
      <dd className="break-words font-semibold text-stone-900">{value}</dd>
    </div>
  );
}

function ActionForm({
  action,
  id,
  locale,
  returnTo,
  value,
  variant = "primary",
  children,
}: Readonly<{
  action: string;
  id: string;
  locale: Locale;
  returnTo: string;
  value?: string;
  variant?: "primary" | "secondary" | "danger";
  children: React.ReactNode;
}>) {
  const className =
    variant === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300"
      : variant === "secondary"
        ? "border-black/10 bg-white text-stone-900 hover:border-black/20"
        : "border-stone-950 bg-stone-950 text-white hover:bg-stone-800";

  return (
    <form action={action} method="post">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {value ? <input type="hidden" name="action" value={value} /> : null}
      <button
        className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-black transition ${className}`}
        type="submit"
      >
        {children}
      </button>
    </form>
  );
}

function Feedback({
  saved,
  error,
  locale,
}: Readonly<{ saved?: string; error?: string; locale: Locale }>) {
  if (error) {
    return <AdminNotice tone="danger">{decodeURIComponent(error)}</AdminNotice>;
  }

  if (!saved) return null;

  return (
    <AdminNotice tone="success">
      {saved === "demo"
        ? locale === "it"
          ? "Demo: stato ricevuto, configura Supabase per salvare."
          : "演示：已收到状态，配置 Supabase 后可真实保存。"
        : locale === "it"
          ? "Stato aggiornato."
          : "状态已更新。"}
    </AdminNotice>
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
