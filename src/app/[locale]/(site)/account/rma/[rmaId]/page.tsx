import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getAccountRmaById } from "@/lib/account-activity";
import {
  formatResolutionType,
  formatRmaIssueType,
  formatRmaStatus,
  formatTimelineEvent,
  statusBadgeClass,
} from "@/lib/account-display";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AccountRmaDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string; rmaId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale: rawLocale, rmaId: rawRmaId } = await params;
  const query = (await searchParams) ?? {};
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const rmaId = decodeURIComponent(rawRmaId);
  const auth = await getAuthContext();
  const rma = await getAccountRmaById(auth, rmaId);

  if (!rma) {
    notFound();
  }

  const status = formatRmaStatus(rma.status, locale);
  const saved = valueOf(query.saved);
  const error = valueOf(query.error);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-orange-200 bg-orange-50 text-orange-700">RMA</Badge>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="min-w-0">
            <h1 className="break-all font-mono text-2xl font-bold text-slate-950">
              {rma.rmaNumber ?? rma.id}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {locale === "it"
                ? "Stato pratica, note del team, allegati, esito e prossime informazioni richieste."
                : "查看售后状态、团队备注、附件、处理结果和需要补充的信息。"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={localizePath(locale, "/account/rma")} variant="secondary">
              {locale === "it" ? "Torna RMA" : "返回售后"}
            </ButtonLink>
            {rma.orderId ? (
              <ButtonLink
                href={localizePath(locale, `/account/orders/${rma.orderId}`)}
                variant="secondary"
              >
                {locale === "it" ? "Apri ordine" : "查看订单"}
              </ButtonLink>
            ) : null}
          </div>
        </div>
        <RmaFeedback saved={saved} error={error} locale={locale} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={locale === "it" ? "Stato" : "处理状态"} display={status} />
        <MetricCard label={locale === "it" ? "Ordine" : "关联订单"} value={rma.orderNumber} />
        <MetricCard label="SKU" value={rma.sku} />
        <MetricCard
          label={locale === "it" ? "Problema" : "问题类型"}
          value={`${formatRmaIssueType(rma.issueType, locale)} x ${rma.quantity}`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Esito e prossima azione" : "处理结果与下一步"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{status.description}</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <InfoRow label={locale === "it" ? "Numero RMA" : "RMA 编号"} value={rma.rmaNumber ?? "-"} />
            <InfoRow
              label={locale === "it" ? "Tipo esito" : "处理类型"}
              value={formatResolutionType(rma.resolutionType, locale)}
            />
            <InfoRow label={locale === "it" ? "SKU sostitutivo" : "换货 SKU"} value={rma.replacementSku ?? "-"} />
            <InfoRow
              label={locale === "it" ? "Importo rimborso" : "退款金额"}
              value={
                rma.refundAmount === null || rma.refundAmount === undefined
                  ? "-"
                  : `${rma.refundAmount.toFixed(2)} EUR`
              }
            />
            <InfoRow
              label={locale === "it" ? "Chiuso" : "关闭时间"}
              value={rma.closedAt ? formatDateTime(rma.closedAt, locale) : "-"}
            />
          </dl>
          {rma.resolutionNote ? (
            <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
              {rma.resolutionNote}
            </p>
          ) : null}
        </article>

        <RmaMessagePanel rmaId={rma.id} locale={locale} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <TimelinePanel
          events={rma.events}
          locale={locale}
          empty={
            locale === "it"
              ? "Gli aggiornamenti della pratica appariranno qui."
              : "售后团队更新后会显示在这里。"
          }
        />
        <AttachmentsPanel rma={rma} locale={locale} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-950">
          {locale === "it" ? "Descrizione iniziale" : "初始问题描述"}
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {rma.description || (locale === "it" ? "Nessuna descrizione." : "无描述。")}
        </p>
        <p className="mt-5 text-xs text-slate-500">
          {formatDateTime(rma.createdAt, locale)}
        </p>
      </section>
    </div>
  );
}

function RmaMessagePanel({
  rmaId,
  locale,
}: Readonly<{ rmaId: string; locale: Locale }>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-950">
        {locale === "it" ? "Aggiungi informazioni" : "补充说明"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {locale === "it"
          ? "Usa questo spazio per rispondere al team post-vendita o aggiungere dettagli tecnici."
          : "可在这里回复售后团队，或补充检测、安装、故障说明。"}
      </p>
      <form action="/api/account/rma/message" method="post" className="mt-4 grid gap-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="id" value={rmaId} />
        <textarea
          className="min-h-28 rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          name="message"
          required
        />
        <button
          className="h-10 rounded-lg border border-blue-600 bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
          type="submit"
        >
          {locale === "it" ? "Invia aggiornamento" : "提交补充说明"}
        </button>
      </form>
    </article>
  );
}

function AttachmentsPanel({
  rma,
  locale,
}: Readonly<{
  rma: NonNullable<Awaited<ReturnType<typeof getAccountRmaById>>>;
  locale: Locale;
}>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-950">
        {locale === "it" ? "Allegati" : "售后附件"}
      </h2>
      {rma.attachments.length ? (
        <div className="mt-4 grid gap-3">
          {rma.attachments.map((attachment) => (
            <a
              key={attachment.id}
              className="rounded-lg bg-slate-50 p-3 text-sm transition hover:bg-blue-50"
              href={attachment.url}
              rel="noreferrer"
              target="_blank"
            >
              <span className="block font-bold text-slate-950">{attachment.label}</span>
              {attachment.note ? (
                <span className="mt-2 block text-sm leading-6 text-slate-600">
                  {attachment.note}
                </span>
              ) : null}
              <span className="mt-2 block text-xs text-slate-500">
                {attachment.createdAt ? formatDateTime(attachment.createdAt, locale) : "-"}
              </span>
            </a>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          {locale === "it"
            ? "Foto, video o documenti della pratica appariranno qui."
            : "售后图片、视频或凭证会显示在这里。"}
        </p>
      )}

      <details className="mt-4">
        <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 hover:border-blue-300 hover:text-blue-700">
          {locale === "it" ? "Aggiungi link allegato" : "添加附件链接"}
        </summary>
        <form action="/api/account/rma/attachment" method="post" className="mt-3 grid gap-3">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="id" value={rma.id} />
          <Input name="label" label={locale === "it" ? "Nome allegato" : "附件名称"} />
          <Input name="url" label={locale === "it" ? "URL allegato" : "附件链接"} />
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            {locale === "it" ? "Nota" : "备注"}
            <textarea
              className="min-h-20 rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              name="note"
            />
          </label>
          <button
            className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:border-blue-300 hover:text-blue-700"
            type="submit"
          >
            {locale === "it" ? "Salva allegato" : "保存附件"}
          </button>
        </form>
      </details>
    </article>
  );
}

function TimelinePanel({
  events,
  locale,
  empty,
}: Readonly<{
  events: NonNullable<Awaited<ReturnType<typeof getAccountRmaById>>>["events"];
  locale: Locale;
  empty: string;
}>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-950">
        {locale === "it" ? "Timeline" : "售后进度"}
      </h2>
      {events.length ? (
        <ol className="mt-4 grid gap-3">
          {events.map((event) => (
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
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{empty}</p>
      )}
    </article>
  );
}

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid gap-1 rounded-lg bg-slate-50 p-2.5 sm:grid-cols-[128px_1fr]">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="break-words font-bold text-slate-950">{value}</dd>
    </div>
  );
}

function MetricCard({
  label,
  value,
  display,
}: Readonly<{
  label: string;
  value?: string;
  display?: ReturnType<typeof formatRmaStatus>;
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
    </article>
  );
}

function Input({
  name,
  label,
}: Readonly<{
  name: string;
  label: string;
}>) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        name={name}
        required
      />
    </label>
  );
}

function RmaFeedback({
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
    created: locale === "it" ? "Pratica RMA creata." : "售后申请已创建。",
    message: locale === "it" ? "Aggiornamento inviato." : "补充说明已提交。",
    attachment: locale === "it" ? "Allegato salvato." : "附件已保存。",
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

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
