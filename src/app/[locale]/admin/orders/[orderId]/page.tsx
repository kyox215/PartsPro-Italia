import { notFound } from "next/navigation";
import { Boxes, ClipboardList, CreditCard, PackageCheck, RotateCcw, TimerReset } from "lucide-react";
import { AdminCsrfField } from "@/components/admin/admin-csrf-field";
import { OrderSubnav } from "@/components/admin/order-subnav";
import { StatusSelectForm } from "@/components/admin/status-select-form";
import {
  AdminActionRail,
  AdminButtonLink,
  AdminDataTable,
  AdminMetricCard,
  AdminMetricStrip,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import { formatAdminStatus, type AdminStatusKind } from "@/lib/admin-display";
import { getAdminOrderById } from "@/lib/admin-operations";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { displayOrderNumber, orderRouteId } from "@/lib/order-number";
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

type AdminOrderDetail = NonNullable<Awaited<ReturnType<typeof getAdminOrderById>>>;

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

  const returnTo = localizePath(locale, `/admin/orders/${orderRouteId(order)}`);
  const stockQty = order.items.reduce((sum, item) => sum + (item.stockQty ?? 0), 0);
  const preorderQty = order.items.reduce(
    (sum, item) => sum + (item.preorderQty ?? 0),
    0,
  );
  const orderStatusLabels = getStatusSelectLabels("order", orderStatuses, locale);
  const orderStatus = formatAdminStatus("order", order.status, locale);
  const paymentStatus = formatAdminStatus("payment", order.paymentStatus ?? "-", locale);
  const paymentMethod = formatAdminStatus("paymentMethod", order.paymentMethod, locale);
  const fulfillmentStatus = formatAdminStatus("fulfillment", order.fulfillmentStatus ?? "-", locale);

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Order detail" : "订单详情"}
        title={<span className="font-mono">{displayOrderNumber(order, locale)}</span>}
        description={
          locale === "it"
            ? "Dettaglio operativo con pagamento, cliente, righe prodotto e fulfilment stock/preorder."
            : "后台订单处理详情，包含付款、客户、商品明细和现货/预购履约。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin/orders")} variant="secondary">
              {locale === "it" ? "Torna ordini" : "返回订单"}
            </AdminButtonLink>
            <AdminButtonLink href={localizePath(locale, "/admin/orders/payments")} variant="secondary">
              {locale === "it" ? "Pagamenti" : "付款处理"}
            </AdminButtonLink>
            <AdminButtonLink href={localizePath(locale, "/admin/inventory")} variant="secondary">
              {locale === "it" ? "Inventario" : "库存"}
            </AdminButtonLink>
          </>
        }
      />
      <Feedback saved={valueOf(query.saved)} error={valueOf(query.error)} locale={locale} />
      <OrderSubnav active="overview" locale={locale} />

      <AdminMetricStrip className="md:grid-cols-2 xl:grid-cols-6">
        <AdminMetricCard icon={ClipboardList} label={locale === "it" ? "Stato" : "状态"} value={<StatusPill status={orderStatus.label} tone={orderStatus.tone} />} tone="blue" />
        <AdminMetricCard
          icon={CreditCard}
          label={locale === "it" ? "Pagamento" : "付款"}
          value={paymentMethod.label}
          tone="amber"
          trend={<StatusPill status={paymentStatus.label} tone={paymentStatus.tone} />}
        />
        <AdminMetricCard icon={Boxes} label={locale === "it" ? "Totale" : "总额"} value={formatMoney(order.total, locale)} tone="green" />
        <AdminMetricCard
          icon={RotateCcw}
          label={locale === "it" ? "Rimborsi" : "已退款"}
          value={formatMoney(order.refundTotal ?? 0, locale)}
          tone="amber"
        />
        <AdminMetricCard icon={PackageCheck} label={locale === "it" ? "Stock" : "现货履约"} value={stockQty} tone="slate" />
        <AdminMetricCard
          icon={TimerReset}
          label={locale === "it" ? "Preorder" : "预购履约"}
          value={preorderQty}
          tone="violet"
          trend={order.fulfillmentStatus ? <StatusPill status={fulfillmentStatus.label} tone={fulfillmentStatus.tone} /> : null}
        />
      </AdminMetricStrip>

      <details className="rounded-lg border border-black/5 bg-white px-3 py-2 text-xs font-semibold text-stone-500 shadow-sm">
        <summary className="cursor-pointer font-black text-stone-700">
          {locale === "it" ? "Informazioni interne" : "内部信息"}
        </summary>
        <div className="mt-2 grid gap-1">
          <p>
            {locale === "it" ? "ID interno" : "内部 ID"}:{" "}
            <span className="break-all font-mono">{order.id}</span>
          </p>
        </div>
      </details>

      <AdminWorkspaceGrid
        className="xl:!grid-cols-[minmax(0,1fr)_280px] 2xl:!grid-cols-[minmax(0,1fr)_300px]"
        rail={
          <AdminActionRail
            title={locale === "it" ? "Azioni ordine" : "订单操作"}
            description={locale === "it" ? "Stato, pagamento e fulfilment" : "状态、收款与履约"}
          >
            <AdminPanel title={locale === "it" ? "Aggiorna stato" : "更新状态"} contentClassName="p-3">
              <StatusSelectForm
                action="/api/admin/orders/status"
                currentStatus={order.status}
                extraFields={<input type="hidden" name="returnTo" value={returnTo} />}
                id={order.id}
                locale={locale}
                statusLabels={orderStatusLabels}
                statuses={orderStatuses}
                submitLabel={locale === "it" ? "Salva" : "保存"}
              />
              <div className="mt-2 rounded-lg bg-stone-50 p-2.5 text-xs font-semibold leading-5 text-stone-700">
                <p>
                  {locale === "it" ? "Subtotal" : "小计"}:{" "}
                  <strong>{formatMoney(order.subtotal ?? 0, locale)}</strong>
                </p>
                <p className="mt-1">
                  IVA/VAT: <strong>{formatMoney(order.vat ?? 0, locale)}</strong>
                </p>
                {order.reservationExpiresAt ? (
                  <p className="mt-1">
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

            <AdminPanel
              title={locale === "it" ? "Azioni rapide" : "快捷操作"}
              description={locale === "it" ? "Incasso, fulfilment e lock." : "收款、履约与锁库。"}
              contentClassName="p-3"
            >
              <div className="grid gap-1.5">
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
              title={locale === "it" ? "Prova pagamento" : "付款凭证"}
              description={
                locale === "it"
                  ? "Registra ricevuta, riferimento o link allegato."
                  : "登记收款凭证、转账参考或附件链接。"
              }
            >
              <PaymentProofForm order={order} locale={locale} returnTo={returnTo} />
            </AdminPanel>

            <AdminPanel
              title={locale === "it" ? "Rimborso" : "退款"}
              description={
                locale === "it"
                  ? "Registra rimborso manuale o invia refund Stripe."
                  : "记录现金/转账退款，或对 Stripe 订单发起银行卡退款。"
              }
            >
              <RefundForm order={order} locale={locale} returnTo={returnTo} />
            </AdminPanel>

            <AdminPanel
              title={locale === "it" ? "Spedizione" : "物流信息"}
              description={
                locale === "it"
                  ? "Tracking visibile al cliente nella pagina ordine."
                  : "客户订单详情页可见物流单号和通知。"
              }
            >
              <ShipmentForm order={order} locale={locale} returnTo={returnTo} />
            </AdminPanel>
          </AdminActionRail>
        }
      >
        <AdminPanel title={locale === "it" ? "Cliente e fattura" : "客户与发票"}>
          <dl className="grid gap-2 text-sm">
            <InfoRow label={locale === "it" ? "Azienda" : "公司"} value={order.companyName || "-"} />
            <InfoRow label={locale === "it" ? "Cliente" : "客户"} value={order.customerName || "-"} />
            <InfoRow label="Email" value={order.email || "-"} />
            <InfoRow label={locale === "it" ? "P.IVA" : "P.IVA / 税号"} value={order.vatNumber || "-"} />
            <InfoRow label={locale === "it" ? "Codice fiscale" : "Fiscal Code"} value={order.fiscalCode || "-"} />
            <InfoRow label="SDI / PEC" value={[order.sdi, order.pec].filter(Boolean).join(" / ") || "-"} />
            <InfoRow label={locale === "it" ? "Indirizzo consegna" : "收货地址"} value={order.shippingAddress || "-"} />
            <InfoRow
              label={locale === "it" ? "Tracking" : "物流单号"}
              value={[order.shippingCarrier, order.trackingNumber].filter(Boolean).join(" / ") || "-"}
            />
            <InfoRow
              label={locale === "it" ? "Nota cliente" : "客户通知"}
              value={order.customerNote || "-"}
            />
          </dl>
          {order.trackingUrl ? (
            <a
              className="mt-3 inline-flex text-sm font-black text-blue-700 hover:text-blue-900"
              href={order.trackingUrl}
              rel="noreferrer"
              target="_blank"
            >
              {locale === "it" ? "Apri tracking" : "打开物流跟踪"}
            </a>
          ) : null}
        </AdminPanel>

        <div className="grid gap-3 xl:grid-cols-2">
          <AdminPanel
            title={locale === "it" ? "Registri pagamento" : "付款记录"}
            description={
              locale === "it"
                ? "Conferme manuali e callback Stripe."
                : "现金/转账确认和 Stripe 回调记录。"
            }
          >
            {order.paymentRecords.length > 0 ? (
              <div className="grid gap-2">
                {order.paymentRecords.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-lg border border-black/5 bg-stone-50 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-black text-stone-950">
                        {formatMoney(record.amount, locale)}
                      </div>
                      <LocalizedStatusPill kind="payment" locale={locale} value={record.paymentStatus} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-stone-500">
                      <span>{formatAdminStatus("paymentMethod", record.paymentMethod, locale).label}</span>
                      {record.provider ? <span>{record.provider}</span> : null}
                      {record.providerReference ? (
                        <span className="font-mono">{record.providerReference}</span>
                      ) : null}
                      {record.proofUrl ? (
                        <a
                          className="font-black text-blue-700 hover:text-blue-900"
                          href={record.proofUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {record.proofLabel || (locale === "it" ? "Allegato" : "凭证")}
                        </a>
                      ) : null}
                    </div>
                    {record.note ? (
                      <p className="mt-2 text-xs font-semibold text-stone-700">
                        {record.note}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs font-semibold text-stone-400">
                      {formatDateTime(record.createdAt, locale)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-stone-50 p-3 text-sm font-semibold text-stone-500">
                {locale === "it"
                  ? "Nessuna conferma pagamento registrata."
                  : "暂无付款确认记录。"}
              </p>
            )}
          </AdminPanel>

          <AdminPanel
            title={locale === "it" ? "Registri rimborso" : "退款记录"}
            description={
              locale === "it"
                ? "Rimborsi parziali, totali e riferimenti provider."
                : "部分/全额退款和 Stripe/手动参考号。"
            }
          >
            {order.refunds.length > 0 ? (
              <div className="grid gap-2">
                {order.refunds.map((refund) => (
                  <div
                    key={refund.id}
                    className="rounded-lg border border-black/5 bg-stone-50 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-black text-stone-950">
                        {formatMoney(refund.amount, locale)}
                      </div>
                      <LocalizedStatusPill kind="refundStatus" locale={locale} value={refund.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-stone-500">
                      <span>{formatAdminStatus("paymentMethod", refund.paymentMethod, locale).label}</span>
                      <span>{formatAdminStatus("refundReason", refund.reason, locale).label}</span>
                      {refund.provider ? <span>{refund.provider}</span> : null}
                      {refund.providerRefundId ? (
                        <span className="font-mono">{refund.providerRefundId}</span>
                      ) : null}
                      {refund.providerStatus ? <span>{refund.providerStatus}</span> : null}
                    </div>
                    {refund.note ? (
                      <p className="mt-2 text-xs font-semibold text-stone-700">
                        {refund.note}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs font-semibold text-stone-400">
                      {formatDateTime(refund.createdAt, locale)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-stone-50 p-3 text-sm font-semibold text-stone-500">
                {locale === "it"
                  ? "Nessun rimborso registrato."
                  : "暂无退款记录。"}
              </p>
            )}
          </AdminPanel>

          <AdminPanel
            title={locale === "it" ? "Timeline ordine" : "订单时间线"}
            description={
              locale === "it"
                ? "Traccia operativa delle azioni admin."
                : "记录后台处理、收款、释放和履约动作。"
            }
          >
            {order.timelineEvents.length > 0 ? (
              <ol className="grid gap-2">
                {order.timelineEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-lg border border-black/5 bg-white p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-black text-stone-950">{event.title}</p>
                      <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-black text-stone-500">
                        {formatAdminStatus("timelineEvent", event.eventType, locale).label}
                      </span>
                    </div>
                    {event.body ? (
                      <p className="mt-2 text-xs font-semibold leading-5 text-stone-600">
                        {event.body}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs font-semibold text-stone-400">
                      {formatDateTime(event.createdAt, locale)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-lg bg-stone-50 p-3 text-sm font-semibold text-stone-500">
                {locale === "it"
                  ? "La timeline si popola con le prossime azioni."
                  : "后续后台操作会自动写入这里。"}
              </p>
            )}
          </AdminPanel>
        </div>

        <AdminPanel
          title={locale === "it" ? "Notifiche cliente" : "客户通知"}
          description={
            locale === "it"
              ? "Outbox email: inviata, saltata o fallita."
              : "邮件 outbox：已发送、跳过或失败。"
          }
        >
          <NotificationList notifications={order.notifications} locale={locale} />
        </AdminPanel>

        <AdminPanel
          title={locale === "it" ? "Righe e fulfilment" : "商品与履约"}
          description={new Date(order.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}
        >
          <AdminDataTable minWidth={940}>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-stone-400">
                <tr className="border-b border-black/5">
                  <th className="px-2.5 py-2">SKU</th>
                  <th className="px-2.5 py-2">{locale === "it" ? "Nome" : "商品名"}</th>
                  <th className="px-2.5 py-2">{locale === "it" ? "Qta" : "数量"}</th>
                  <th className="px-2.5 py-2">{locale === "it" ? "Stock" : "现货"}</th>
                  <th className="px-2.5 py-2">{locale === "it" ? "Preorder" : "预购"}</th>
                  <th className="px-2.5 py-2">{locale === "it" ? "Totale riga" : "行小计"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {order.items.map((item) => (
                  <tr key={`${order.id}-${item.sku}`} className="hover:bg-stone-50">
                    <td className="px-2.5 py-2.5 font-mono text-xs font-black text-stone-900">
                      {item.sku}
                    </td>
                    <td className="px-2.5 py-2.5 font-semibold text-stone-700">
                      {getOrderItemName(item, locale)}
                    </td>
                    <td className="px-2.5 py-2.5 font-black text-stone-950">{item.quantity}</td>
                    <td className="px-2.5 py-2.5">{item.stockQty ?? 0}</td>
                    <td className="px-2.5 py-2.5">
                      <span>{item.preorderQty ?? 0}</span>
                      {item.preorderQty &&
                      item.preorderLeadTimeMinDays &&
                      item.preorderLeadTimeMaxDays ? (
                        <span className="ml-2 text-xs font-semibold text-stone-500">
                          {item.preorderLeadTimeMinDays}-{item.preorderLeadTimeMaxDays}d
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2.5 py-2.5 font-black text-stone-950">
                      {formatMoney(item.unitPrice * item.quantity, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminDataTable>
        </AdminPanel>
      </AdminWorkspaceGrid>
    </div>
  );
}

function PaymentProofForm({
  order,
  locale,
  returnTo,
}: Readonly<{
  order: Awaited<ReturnType<typeof getAdminOrderById>>;
  locale: Locale;
  returnTo: string;
}>) {
  if (!order) return null;

  return (
    <form
      action="/api/admin/orders/payment-proof"
      className="grid gap-2"
      encType="multipart/form-data"
      method="post"
    >
      <AdminCsrfField />
      <input type="hidden" name="id" value={order.id} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Metodo" : "付款方式"}
        <select
          className="h-9 rounded-lg border border-black/10 bg-white px-2.5 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          defaultValue={order.paymentMethod}
          name="paymentMethod"
        >
          <option value="bank_transfer">{locale === "it" ? "Bonifico" : "银行转账"}</option>
          <option value="cash">{locale === "it" ? "Contanti" : "现金"}</option>
          <option value="stripe">{locale === "it" ? "Carta Stripe" : "Stripe 银行卡"}</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Stato pagamento" : "付款状态"}
        <select
          className="h-9 rounded-lg border border-black/10 bg-white px-2.5 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          defaultValue={order.paymentStatus ?? "pending_bank_transfer"}
          name="paymentStatus"
        >
          <option value="pending_bank_transfer">{locale === "it" ? "Bonifico atteso" : "等待转账"}</option>
          <option value="pending_cash">{locale === "it" ? "Contanti attesi" : "等待现金"}</option>
          <option value="pending_card">{locale === "it" ? "Carta attesa" : "等待银行卡"}</option>
          <option value="paid">{locale === "it" ? "Pagato" : "已支付"}</option>
          <option value="failed">{locale === "it" ? "Fallito" : "失败"}</option>
          <option value="cancelled">{locale === "it" ? "Annullato" : "已取消"}</option>
          <option value="refunded">{locale === "it" ? "Rimborsato" : "已退款"}</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Importo" : "金额"}
        <input
          className="h-9 rounded-lg border border-black/10 bg-white px-2.5 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          defaultValue={order.total}
          min="0"
          name="amount"
          step="0.01"
          type="number"
        />
      </label>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Riferimento" : "付款参考号"}
        <input
          className="h-9 rounded-lg border border-black/10 bg-white px-2.5 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          name="providerReference"
          placeholder={locale === "it" ? "CRO / ID transazione" : "CRO / 交易号"}
        />
      </label>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Carica file" : "上传文件"}
        <input
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,text/plain"
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-stone-950 file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-stone-700"
          name="file"
          type="file"
        />
      </label>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Oppure link allegato" : "或填写凭证链接"}
        <input
          className="h-9 rounded-lg border border-black/10 bg-white px-2.5 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          name="proofUrl"
          placeholder="https://..."
          type="url"
        />
      </label>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Etichetta" : "凭证名称"}
        <input
          className="h-9 rounded-lg border border-black/10 bg-white px-2.5 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          name="proofLabel"
          placeholder={locale === "it" ? "Ricevuta bonifico" : "银行转账截图"}
        />
      </label>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Nota" : "备注"}
        <textarea
          className="min-h-16 rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          name="note"
          placeholder={locale === "it" ? "Dettagli incasso" : "收款说明"}
        />
      </label>
      <button
        className="inline-flex h-9 items-center justify-center rounded-lg border border-stone-950 bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800"
        type="submit"
      >
        {locale === "it" ? "Salva prova" : "保存付款凭证"}
      </button>
    </form>
  );
}

function RefundForm({
  order,
  locale,
  returnTo,
}: Readonly<{
  order: Awaited<ReturnType<typeof getAdminOrderById>>;
  locale: Locale;
  returnTo: string;
}>) {
  if (!order) return null;

  const remaining = Math.max(order.total - (order.refundTotal ?? 0), 0);

  return (
    <form action="/api/admin/orders/refund" className="grid gap-2" method="post">
      <AdminCsrfField />
      <input type="hidden" name="id" value={order.id} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="rounded-lg bg-stone-50 p-3 text-xs font-semibold leading-5 text-stone-700">
        <p>
          {locale === "it" ? "Rimborsabile" : "可退款"}:{" "}
          <strong>{formatMoney(remaining, locale)}</strong>
        </p>
        <p className="mt-1">
          {locale === "it" ? "Metodo originale" : "原支付方式"}:{" "}
          <strong>{order.paymentMethod}</strong>
        </p>
      </div>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Importo rimborso" : "退款金额"}
        <input
          className="h-9 rounded-lg border border-black/10 bg-white px-2.5 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          defaultValue={remaining > 0 ? remaining.toFixed(2) : ""}
          max={remaining || undefined}
          min="0.01"
          name="amount"
          step="0.01"
          type="number"
        />
      </label>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Motivo" : "退款原因"}
        <select
          className="h-9 rounded-lg border border-black/10 bg-white px-2.5 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          defaultValue="requested_by_customer"
          name="reason"
        >
          <option value="requested_by_customer">
            {locale === "it" ? "Richiesta cliente" : "客户要求"}
          </option>
          <option value="order_cancelled">
            {locale === "it" ? "Ordine annullato" : "订单取消"}
          </option>
          <option value="duplicate">{locale === "it" ? "Duplicato" : "重复付款"}</option>
          <option value="fraudulent">{locale === "it" ? "Frode" : "欺诈风险"}</option>
          <option value="other">{locale === "it" ? "Altro" : "其他"}</option>
        </select>
      </label>
      {order.paymentMethod !== "stripe" ? (
        <label className="grid gap-1 text-xs font-black text-stone-500">
          {locale === "it" ? "Riferimento rimborso" : "退款参考号"}
          <input
            className="h-9 rounded-lg border border-black/10 bg-white px-2.5 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
            name="providerReference"
            placeholder={locale === "it" ? "Bonifico / ricevuta" : "转账单号 / 现金凭证"}
          />
        </label>
      ) : null}
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Nota" : "备注"}
        <textarea
          className="min-h-16 rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          name="note"
          placeholder={
            order.paymentMethod === "stripe"
              ? locale === "it"
                ? "Viene creato un refund Stripe."
                : "提交后会创建 Stripe 退款。"
              : locale === "it"
                ? "Descrivi come hai rimborsato."
                : "说明现金/转账退款方式。"
          }
        />
      </label>
      <button
        className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-700 transition hover:border-rose-300"
        disabled={remaining <= 0}
        type="submit"
      >
        {locale === "it" ? "Registra rimborso" : "确认退款"}
      </button>
    </form>
  );
}

function ShipmentForm({
  order,
  locale,
  returnTo,
}: Readonly<{
  order: Awaited<ReturnType<typeof getAdminOrderById>>;
  locale: Locale;
  returnTo: string;
}>) {
  if (!order) return null;

  return (
    <form action="/api/admin/orders/shipment" className="grid gap-2" method="post">
      <AdminCsrfField />
      <input type="hidden" name="id" value={order.id} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Corriere" : "物流公司"}
        <input
          className="h-9 rounded-lg border border-black/10 bg-white px-2.5 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          defaultValue={order.shippingCarrier ?? ""}
          name="shippingCarrier"
          placeholder="DHL / GLS / BRT"
        />
      </label>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Tracking" : "物流单号"}
        <input
          className="h-9 rounded-lg border border-black/10 bg-white px-2.5 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          defaultValue={order.trackingNumber ?? ""}
          name="trackingNumber"
        />
      </label>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "URL tracking" : "跟踪链接"}
        <input
          className="h-9 rounded-lg border border-black/10 bg-white px-2.5 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          defaultValue={order.trackingUrl ?? ""}
          name="trackingUrl"
          placeholder="https://..."
          type="url"
        />
      </label>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Nota cliente" : "客户通知"}
        <textarea
          className="min-h-16 rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          defaultValue={order.customerNote ?? ""}
          name="customerNote"
          placeholder={locale === "it" ? "Messaggio visibile al cliente" : "客户订单详情页可见"}
        />
      </label>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Nota interna" : "内部备注"}
        <textarea
          className="min-h-16 rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          defaultValue={order.shipmentNote ?? ""}
          name="shipmentNote"
        />
      </label>
      <button
        className="inline-flex h-9 items-center justify-center rounded-lg border border-stone-950 bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800"
        type="submit"
      >
        {locale === "it" ? "Salva tracking" : "保存物流信息"}
      </button>
    </form>
  );
}

function NotificationList({
  notifications,
  locale,
}: Readonly<{
  notifications: NonNullable<Awaited<ReturnType<typeof getAdminOrderById>>>["notifications"];
  locale: Locale;
}>) {
  if (!notifications.length) {
    return (
      <p className="rounded-lg bg-stone-50 p-3 text-sm font-semibold text-stone-500">
        {locale === "it"
          ? "Nessuna notifica registrata."
          : "暂无客户通知记录。"}
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {notifications.map((notification) => (
        <div key={notification.id} className="rounded-lg border border-black/5 bg-stone-50 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-black text-stone-950">{notification.subject}</p>
            <LocalizedStatusPill kind="notification" locale={locale} value={notification.status} />
          </div>
          <p className="mt-2 text-xs font-semibold text-stone-500">
            {notification.recipientEmail}
          </p>
          {notification.errorMessage ? (
            <p className="mt-2 text-xs font-semibold leading-5 text-rose-700">
              {notification.errorMessage}
            </p>
          ) : null}
          <p className="mt-2 text-xs font-semibold text-stone-400">
            {formatDateTime(notification.sentAt ?? notification.createdAt, locale)}
          </p>
        </div>
      ))}
    </div>
  );
}

function LocalizedStatusPill({
  kind,
  value,
  locale,
}: Readonly<{ kind: AdminStatusKind; value: string | null | undefined; locale: Locale }>) {
  const status = formatAdminStatus(kind, value, locale);
  return <StatusPill status={status.label} tone={status.tone} />;
}

function getOrderItemName(
  item: AdminOrderDetail["items"][number],
  locale: Locale,
) {
  const localizedName = locale === "zh" ? item.nameZh : item.nameIt;
  const name = (localizedName || item.name || "").trim();
  return name && name !== item.sku
    ? name
    : locale === "it"
      ? "Nome prodotto da completare"
      : "商品名待补全";
}

function getStatusSelectLabels(
  kind: AdminStatusKind,
  values: string[],
  locale: Locale,
) {
  return Object.fromEntries(
    values.map((value) => [value, formatAdminStatus(kind, value, locale).label]),
  );
}

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid gap-1 rounded-lg bg-stone-50 p-2 sm:grid-cols-[128px_1fr]">
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
      <AdminCsrfField />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {value ? <input type="hidden" name="action" value={value} /> : null}
      <button
        className={`inline-flex h-8 w-full items-center justify-center rounded-lg border px-2.5 text-xs font-black transition ${className}`}
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

function formatDateTime(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale === "it" ? "it-IT" : "zh-CN");
}
