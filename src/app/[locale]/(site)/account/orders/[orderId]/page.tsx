import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getAccountOrderById, type AccountOrderRow } from "@/lib/account-activity";
import {
  canCreateRma,
  canSubmitPaymentProof,
  formatFulfillmentStatus,
  formatFulfillmentType,
  formatOrderStatus,
  formatPaymentMethod,
  formatPaymentStatus,
  formatRmaIssueType,
  formatTimelineEvent,
  getAccountNextActions,
  statusBadgeClass,
} from "@/lib/account-display";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

export default async function AccountOrderDetailPage({
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
  const order = await getAccountOrderById(auth, orderId);

  if (!order) {
    notFound();
  }

  const orderStatus = formatOrderStatus(order.status, locale);
  const paymentStatus = formatPaymentStatus(order.paymentStatus, locale);
  const fulfillmentStatus = formatFulfillmentStatus(order.fulfillmentStatus, locale);
  const stockQty = order.items.reduce((sum, item) => sum + (item.stockQty ?? 0), 0);
  const preorderQty = order.items.reduce(
    (sum, item) => sum + (item.preorderQty ?? 0),
    0,
  );
  const nextActions = getAccountNextActions(order, locale);
  const saved = valueOf(query.saved);
  const error = valueOf(query.error);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">
          {locale === "it" ? "Dettaglio ordine" : "订单详情"}
        </Badge>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="min-w-0">
            <h1 className="break-all font-mono text-2xl font-bold text-slate-950">
              {order.id}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {locale === "it"
                ? "Stato, pagamento, stock riservato, preorder, spedizione e RMA collegati a questo ordine."
                : "查看此订单的状态、付款、库存锁定、预购、物流和售后入口。"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={localizePath(locale, "/account/orders")} variant="secondary">
              {locale === "it" ? "Torna ordini" : "返回订单"}
            </ButtonLink>
            <form action="/api/account/orders/reorder" method="post">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="id" value={order.id} />
              <button
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:border-blue-300 hover:text-blue-700"
                type="submit"
              >
                {locale === "it" ? "Riordina" : "再次购买"}
              </button>
            </form>
          </div>
        </div>
        <AccountDetailFeedback saved={saved} error={error} locale={locale} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label={locale === "it" ? "Stato" : "订单状态"} display={orderStatus} />
        <MetricCard
          label={locale === "it" ? "Pagamento" : "付款状态"}
          display={paymentStatus}
          extra={formatPaymentMethod(order.paymentMethod, locale)}
        />
        <MetricCard
          label={locale === "it" ? "Totale" : "订单总额"}
          value={formatMoney(order.total, locale)}
        />
        <MetricCard
          label={locale === "it" ? "Rimborsato" : "已退款"}
          value={formatMoney(order.refundTotal ?? 0, locale)}
        />
        <MetricCard
          label={locale === "it" ? "Fulfilment" : "履约状态"}
          display={fulfillmentStatus}
          extra={`${locale === "it" ? "Stock" : "现货"} ${stockQty} / ${locale === "it" ? "Preorder" : "预购"} ${preorderQty}`}
        />
      </section>

      {order.reservationExpiresAt && order.paymentStatus !== "paid" ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {locale === "it" ? "Merce riservata fino a" : "库存锁定到"}{" "}
          <strong>{formatDateTime(order.reservationExpiresAt, locale)}</strong>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <NextActionPanel order={order} locale={locale} actions={nextActions} />
        <PaymentProofPanel order={order} locale={locale} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Spedizione" : "物流信息"}
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <InfoRow
              label={locale === "it" ? "Corriere" : "物流公司"}
              value={order.shippingCarrier ?? "-"}
            />
            <InfoRow
              label={locale === "it" ? "Tracking" : "物流单号"}
              value={order.trackingNumber ?? "-"}
            />
            <InfoRow
              label={locale === "it" ? "Spedito" : "发货时间"}
              value={order.shippedAt ? formatDateTime(order.shippedAt, locale) : "-"}
            />
          </dl>
          {order.trackingUrl ? (
            <a
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:border-blue-300"
              href={order.trackingUrl}
              rel="noreferrer"
              target="_blank"
            >
              {locale === "it" ? "Apri tracking" : "打开物流跟踪"}
            </a>
          ) : null}
          {order.customerNote ? (
            <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
              {order.customerNote}
            </p>
          ) : null}
        </article>

        <OrderMessagePanel order={order} locale={locale} />

        <PaymentRecordsPanel order={order} locale={locale} />
        <RefundsPanel order={order} locale={locale} />
      </section>

      <TimelinePanel order={order} locale={locale} />
      <OrderItemsPanel order={order} locale={locale} />
    </div>
  );
}

function NextActionPanel({
  order,
  locale,
  actions,
}: Readonly<{
  order: AccountOrderRow;
  locale: Locale;
  actions: ReturnType<typeof getAccountNextActions>;
}>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-950">
        {locale === "it" ? "Prossime azioni" : "下一步操作"}
      </h2>
      <div className="mt-4 grid gap-3">
        {actions.map((action) => (
          <div key={action.key} className="rounded-lg bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-slate-950">{action.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {action.description}
                </p>
              </div>
              {action.href ? (
                <a
                  className="inline-flex h-9 items-center rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700"
                  href={action.href}
                  rel={action.key === "tracking" ? "noreferrer" : undefined}
                  target={action.key === "tracking" ? "_blank" : undefined}
                >
                  {locale === "it" ? "Apri" : "打开"}
                </a>
              ) : action.formAction && action.key !== "payment_proof" ? (
                <form action={action.formAction} method="post">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="id" value={order.id} />
                  <button
                    className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-bold ${action.key === "cancel" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
                    type="submit"
                  >
                    {locale === "it" ? "Conferma" : "执行"}
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function PaymentProofPanel({
  order,
  locale,
}: Readonly<{ order: AccountOrderRow; locale: Locale }>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5" id="payment-proof">
      <h2 className="text-lg font-bold text-slate-950">
        {locale === "it" ? "Prova pagamento" : "付款凭证"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {locale === "it"
          ? "Il team admin confermera il pagamento dopo aver verificato il riferimento."
          : "提交后仍需后台确认，确认后订单才会变为已付款。"}
      </p>
      {canSubmitPaymentProof(order) ? (
        <form action="/api/account/orders/payment-proof" method="post" className="mt-4 grid gap-3">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="id" value={order.id} />
          <Input
            label={locale === "it" ? "Riferimento pagamento" : "付款参考号"}
            name="providerReference"
            placeholder={locale === "it" ? "CRO / TRN / contanti" : "转账流水号 / 现金备注"}
          />
          <Input
            label={locale === "it" ? "Link allegato opzionale" : "凭证链接（可选）"}
            name="proofUrl"
            placeholder="https://..."
          />
          <Input
            label={locale === "it" ? "Nome allegato" : "凭证名称"}
            name="proofLabel"
          />
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            {locale === "it" ? "Nota" : "备注"}
            <textarea
              className="min-h-24 rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              name="note"
            />
          </label>
          <button
            className="h-11 rounded-lg border border-blue-600 bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
            type="submit"
          >
            {locale === "it" ? "Invia prova" : "提交凭证"}
          </button>
        </form>
      ) : (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          {locale === "it"
            ? "Non sono richieste prove pagamento per questo stato."
            : "当前订单状态不需要提交付款凭证。"}
        </p>
      )}
    </article>
  );
}

function OrderMessagePanel({
  order,
  locale,
}: Readonly<{ order: AccountOrderRow; locale: Locale }>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-950">
        {locale === "it" ? "Messaggio al team" : "联系后台团队"}
      </h2>
      <form action="/api/account/orders/message" method="post" className="mt-4 grid gap-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="id" value={order.id} />
        <textarea
          className="min-h-24 rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          name="message"
          placeholder={
            locale === "it"
              ? "Scrivi una nota su pagamento, consegna o preorder..."
              : "补充付款、物流、预购或其他说明..."
          }
          required
        />
        <button
          className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:border-blue-300 hover:text-blue-700"
          type="submit"
        >
          {locale === "it" ? "Invia messaggio" : "提交留言"}
        </button>
      </form>
    </article>
  );
}

function PaymentRecordsPanel({
  order,
  locale,
}: Readonly<{ order: AccountOrderRow; locale: Locale }>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-950">
        {locale === "it" ? "Pagamenti" : "付款记录"}
      </h2>
      {order.paymentRecords.length ? (
        <div className="mt-4 grid gap-3">
          {order.paymentRecords.map((record) => {
            const status = formatPaymentStatus(record.paymentStatus, locale);
            return (
              <div key={record.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-slate-950">
                    {formatMoney(record.amount, locale)}
                  </strong>
                  <Badge className={statusBadgeClass(status.tone)}>{status.label}</Badge>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {[formatPaymentMethod(record.paymentMethod, locale), record.providerReference]
                    .filter(Boolean)
                    .join(" / ")}
                </p>
                {record.proofUrl ? (
                  <a
                    className="mt-2 inline-flex text-sm font-bold text-blue-700 hover:text-blue-900"
                    href={record.proofUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {record.proofLabel || (locale === "it" ? "Allegato" : "付款凭证")}
                  </a>
                ) : null}
                {record.note ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">{record.note}</p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">
                  {formatDateTime(record.createdAt, locale)}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          {locale === "it"
            ? "Le conferme e le prove pagamento appariranno qui."
            : "付款确认和客户提交的凭证会显示在这里。"}
        </p>
      )}
    </article>
  );
}

function RefundsPanel({
  order,
  locale,
}: Readonly<{ order: AccountOrderRow; locale: Locale }>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-950">
        {locale === "it" ? "Rimborsi" : "退款记录"}
      </h2>
      {order.refunds.length ? (
        <div className="mt-4 grid gap-3">
          {order.refunds.map((refund) => (
            <div key={refund.id} className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-slate-950">
                  {formatMoney(refund.amount, locale)}
                </strong>
                <Badge className="border-orange-200 bg-orange-50 text-orange-700">
                  {formatRefundStatus(refund.status, locale)}
                </Badge>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {[
                  formatPaymentMethod(refund.paymentMethod, locale),
                  formatRefundReason(refund.reason, locale),
                  refund.providerRefundId,
                ]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
              {refund.note ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">{refund.note}</p>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">
                {formatDateTime(refund.createdAt, locale)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          {locale === "it"
            ? "Eventuali rimborsi appariranno qui dopo la gestione admin."
            : "后台处理退款后，记录会显示在这里。"}
        </p>
      )}
    </article>
  );
}

function TimelinePanel({
  order,
  locale,
}: Readonly<{ order: AccountOrderRow; locale: Locale }>) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-950">
        {locale === "it" ? "Timeline ordine" : "订单进度"}
      </h2>
      {order.timelineEvents.length ? (
        <ol className="mt-4 grid gap-3">
          {order.timelineEvents.map((event) => (
            <li key={event.id} className="rounded-lg bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-slate-950">
                  {formatTimelineEvent(event.eventType, locale)}
                </p>
                <Badge className="border-slate-200 bg-white text-slate-600">
                  {formatDateTime(event.createdAt, locale)}
                </Badge>
              </div>
              {event.body ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {event.body}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">
                {formatDateTime(event.createdAt, locale)}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          {locale === "it"
            ? "Gli aggiornamenti dell'ordine appariranno qui."
            : "订单处理进度会显示在这里。"}
        </p>
      )}
    </section>
  );
}

function OrderItemsPanel({
  order,
  locale,
}: Readonly<{ order: AccountOrderRow; locale: Locale }>) {
  const rmaAllowed = canCreateRma(order);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">
          {locale === "it" ? "Righe ordine" : "订单商品"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {new Date(order.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}
        </p>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {order.items.map((item) => (
          <OrderItemCard
            key={`${order.id}-${item.sku}-mobile`}
            order={order}
            item={item}
            locale={locale}
            rmaAllowed={rmaAllowed}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Fulfillment</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">RMA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {order.items.map((item) => (
              <tr key={`${order.id}-${item.sku}`}>
                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                  {item.sku}
                </td>
                <td className="px-4 py-3 text-slate-700">{item.name}</td>
                <td className="px-4 py-3 font-semibold text-slate-950">
                  {item.quantity}
                </td>
                <td className="px-4 py-3">
                  <FulfillmentBadges item={item} locale={locale} />
                </td>
                <td className="px-4 py-3 font-bold text-slate-950">
                  {formatMoney(item.unitPrice * item.quantity, locale)}
                </td>
                <td className="px-4 py-3">
                  <RmaRequestDetails
                    order={order}
                    sku={item.sku}
                    maxQuantity={item.quantity}
                    locale={locale}
                    enabled={rmaAllowed}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OrderItemCard({
  order,
  item,
  locale,
  rmaAllowed,
}: Readonly<{
  order: AccountOrderRow;
  item: AccountOrderRow["items"][number];
  locale: Locale;
  rmaAllowed: boolean;
}>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="break-all font-mono text-xs font-bold text-slate-900">{item.sku}</p>
      <h3 className="mt-2 text-sm font-bold text-slate-950">{item.name}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge className="border-slate-300 bg-white text-slate-800">
          {locale === "it" ? "Qta" : "数量"} {item.quantity}
        </Badge>
        <Badge className="border-slate-300 bg-white text-slate-800">
          {formatMoney(item.unitPrice * item.quantity, locale)}
        </Badge>
      </div>
      <div className="mt-3">
        <FulfillmentBadges item={item} locale={locale} />
      </div>
      <div className="mt-3">
        <RmaRequestDetails
          order={order}
          sku={item.sku}
          maxQuantity={item.quantity}
          locale={locale}
          enabled={rmaAllowed}
        />
      </div>
    </article>
  );
}

function FulfillmentBadges({
  item,
  locale,
}: Readonly<{ item: AccountOrderRow["items"][number]; locale: Locale }>) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge className="border-slate-300 bg-slate-100 text-slate-800">
        {formatFulfillmentType(item.fulfillmentType ?? "stock", locale)}
      </Badge>
      {item.stockQty ? (
        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
          {locale === "it" ? "Stock" : "现货"} {item.stockQty}
        </Badge>
      ) : null}
      {item.preorderQty ? (
        <Badge className="border-orange-200 bg-orange-50 text-orange-700">
          {locale === "it" ? "Preorder" : "预购"} {item.preorderQty}
          {item.preorderLeadTimeMinDays && item.preorderLeadTimeMaxDays
            ? ` / ${item.preorderLeadTimeMinDays}-${item.preorderLeadTimeMaxDays}d`
            : ""}
        </Badge>
      ) : null}
    </div>
  );
}

function RmaRequestDetails({
  order,
  sku,
  maxQuantity,
  locale,
  enabled,
}: Readonly<{
  order: AccountOrderRow;
  sku: string;
  maxQuantity: number;
  locale: Locale;
  enabled: boolean;
}>) {
  if (!enabled) {
    return (
      <span className="text-xs font-semibold text-slate-500">
        {locale === "it" ? "Disponibile dopo pagamento" : "付款确认后可申请"}
      </span>
    );
  }

  return (
    <details className="group">
      <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 hover:border-blue-300 hover:text-blue-700">
        {locale === "it" ? "Apri RMA" : "申请售后"}
      </summary>
      <form action="/api/account/rma/create" method="post" className="mt-3 grid gap-2">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="orderId" value={order.id} />
        <input type="hidden" name="sku" value={sku} />
        <label className="grid gap-1 text-xs font-semibold text-slate-700">
          {locale === "it" ? "Quantita" : "数量"}
          <input
            className="h-9 rounded-lg border border-slate-300 px-2 text-sm"
            max={maxQuantity}
            min={1}
            name="quantity"
            type="number"
            defaultValue={1}
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-700">
          {locale === "it" ? "Tipo problema" : "问题类型"}
          <select className="h-9 rounded-lg border border-slate-300 px-2 text-sm" name="issueType">
            {["defective", "wrong_item", "damaged", "compatibility", "touch_issue", "other"].map(
              (value) => (
                <option key={value} value={value}>
                  {formatRmaIssueType(value, locale)}
                </option>
              ),
            )}
          </select>
        </label>
        <textarea
          className="min-h-20 rounded-lg border border-slate-300 p-2 text-sm"
          name="description"
          placeholder={locale === "it" ? "Descrivi il problema" : "描述问题"}
        />
        <button
          className="h-9 rounded-lg border border-blue-600 bg-blue-600 px-3 text-xs font-bold text-white"
          type="submit"
        >
          {locale === "it" ? "Invia RMA" : "提交售后"}
        </button>
      </form>
    </details>
  );
}

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid gap-1 rounded-lg bg-slate-50 p-2.5 sm:grid-cols-[112px_1fr]">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="break-words font-bold text-slate-950">{value}</dd>
    </div>
  );
}

function Input({
  label,
  name,
  placeholder,
}: Readonly<{ label: string; name: string; placeholder?: string }>) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}

function MetricCard({
  label,
  value,
  display,
  extra,
}: Readonly<{
  label: string;
  value?: string;
  display?: ReturnType<typeof formatOrderStatus>;
  extra?: string;
}>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {display ? (
        <Badge className={`mt-2 ${statusBadgeClass(display.tone)}`}>
          {display.label}
        </Badge>
      ) : (
        <p className="mt-2 break-words text-xl font-bold text-slate-950">{value}</p>
      )}
      {extra ? <p className="mt-2 text-xs font-semibold text-slate-500">{extra}</p> : null}
    </article>
  );
}

function AccountDetailFeedback({
  saved,
  error,
  locale,
}: Readonly<{ saved?: string; error?: string; locale: Locale }>) {
  if (error) {
    return (
      <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        {decodeURIComponent(error)}
      </div>
    );
  }

  if (!saved) return null;

  const labels: Record<string, string> = {
    cancelled: locale === "it" ? "Ordine annullato." : "订单已取消。",
    "payment-proof":
      locale === "it" ? "Prova pagamento inviata." : "付款凭证已提交。",
    message: locale === "it" ? "Messaggio inviato." : "留言已提交。",
    demo: locale === "it" ? "Demo: azione ricevuta." : "演示：操作已接收。",
  };

  return (
    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
      {labels[saved] ?? (locale === "it" ? "Aggiornato." : "已更新。")}
    </div>
  );
}

function formatDateTime(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale === "it" ? "it-IT" : "zh-CN");
}

function formatRefundStatus(status: string, locale: Locale) {
  const labels: Record<string, Record<Locale, string>> = {
    pending: { it: "In corso", zh: "处理中" },
    succeeded: { it: "Riuscito", zh: "已完成" },
    failed: { it: "Fallito", zh: "失败" },
    cancelled: { it: "Annullato", zh: "已取消" },
  };

  return labels[status]?.[locale] ?? status;
}

function formatRefundReason(reason: string, locale: Locale) {
  const labels: Record<string, Record<Locale, string>> = {
    duplicate: { it: "Duplicato", zh: "重复付款" },
    fraudulent: { it: "Frode", zh: "欺诈风险" },
    requested_by_customer: { it: "Richiesta cliente", zh: "客户申请" },
    order_cancelled: { it: "Ordine annullato", zh: "订单取消" },
    rma_refund: { it: "Rimborso RMA", zh: "售后退款" },
    other: { it: "Altro", zh: "其他原因" },
  };

  return labels[reason]?.[locale] ?? reason;
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
