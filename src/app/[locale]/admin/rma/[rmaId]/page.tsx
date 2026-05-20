import { notFound } from "next/navigation";
import { ClipboardList, PackageCheck, RotateCcw, Wrench } from "lucide-react";
import { AdminCsrfField } from "@/components/admin/admin-csrf-field";
import { StatusSelectForm } from "@/components/admin/status-select-form";
import {
  AdminActionRail,
  AdminButtonLink,
  AdminMetricCard,
  AdminMetricStrip,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import { getAdminRmaById, type AdminRmaRow } from "@/lib/admin-operations";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

const rmaStatuses = [
  "submitted",
  "waiting_information",
  "approved_return",
  "waiting_receive",
  "testing",
  "approved",
  "rejected",
  "replacement_sent",
  "refund_processing",
  "completed",
];

export default async function AdminRmaDetailPage({
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
  const rma = !auth.configured || auth.isAdmin ? await getAdminRmaById(rmaId) : null;

  if (!rma) {
    notFound();
  }

  const returnTo = localizePath(locale, `/admin/rma/${rma.id}`);

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "RMA detail" : "RMA 详情"}
        title={<span className="break-all font-mono">{rma.rmaNumber ?? rma.id}</span>}
        description={
          locale === "it"
            ? "Dettaglio post-vendita per verifica tecnica, stato e collegamento ordine."
            : "售后处理详情，用于技术检测、状态流转和关联订单追踪。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin/rma")} variant="secondary">
              {locale === "it" ? "Torna RMA" : "返回 RMA"}
            </AdminButtonLink>
            <AdminButtonLink
              href={localizePath(locale, `/admin/orders/${rma.orderId ?? rma.orderNumber}`)}
              variant="secondary"
            >
              {locale === "it" ? "Ordine" : "关联订单"}
            </AdminButtonLink>
          </>
        }
      />
      <Feedback saved={valueOf(query.saved)} error={valueOf(query.error)} locale={locale} />

      <AdminMetricStrip className="md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard icon={RotateCcw} label={locale === "it" ? "Stato" : "状态"} value={<StatusPill status={rma.status} />} tone="amber" />
        <AdminMetricCard icon={ClipboardList} label={locale === "it" ? "Ordine" : "订单"} value={rma.orderNumber} tone="blue" />
        <AdminMetricCard icon={Wrench} label="SKU" value={rma.sku} tone="slate" />
        <AdminMetricCard icon={PackageCheck} label={locale === "it" ? "Quantita" : "数量"} value={String(rma.quantity)} tone="green" />
      </AdminMetricStrip>

      <AdminWorkspaceGrid
        rail={
          <AdminActionRail
            title={locale === "it" ? "Azioni RMA" : "售后操作"}
            description={locale === "it" ? "Fase pratica e collegamenti" : "状态流转和关联入口"}
          >
            <AdminPanel
              title={locale === "it" ? "Stato pratica" : "售后状态"}
              description={
                locale === "it"
                  ? "Attesa rientro, testing, sostituzione, rimborso o chiusura."
                  : "等待退回、检测、换货、退款或完成。"
              }
            >
              <StatusSelectForm
                action="/api/admin/rma/status"
                currentStatus={rma.status}
                extraFields={<input type="hidden" name="returnTo" value={returnTo} />}
                id={rma.id}
                locale={locale}
                statuses={rmaStatuses}
              />
            </AdminPanel>
            <AdminPanel
              title={locale === "it" ? "Esito" : "处理结论"}
              description={
                locale === "it"
                  ? "Rimborso, sostituzione, riparazione o rifiuto."
                  : "登记退款、换货、维修或拒绝处理。"
              }
            >
              <ResolutionForm rma={rma} locale={locale} returnTo={returnTo} />
            </AdminPanel>
            <AdminPanel
              title={locale === "it" ? "Allegato" : "售后附件"}
              description={
                locale === "it"
                  ? "Link foto, video o documento visibile al cliente."
                  : "登记照片、视频或文件链接，客户详情页可见。"
              }
            >
              <AttachmentForm rma={rma} locale={locale} returnTo={returnTo} />
            </AdminPanel>
            <AdminPanel title={locale === "it" ? "Collegamenti" : "关联信息"} contentClassName="grid gap-2 p-2">
              <AdminButtonLink
                href={localizePath(locale, `/admin/orders/${rma.orderId ?? rma.orderNumber}`)}
                variant="secondary"
              >
                {locale === "it" ? "Apri ordine" : "查看关联订单"}
              </AdminButtonLink>
              <AdminButtonLink href={localizePath(locale, "/admin/rma")} variant="secondary">
                {locale === "it" ? "Lista RMA" : "RMA 列表"}
              </AdminButtonLink>
            </AdminPanel>
          </AdminActionRail>
        }
      >
        <AdminPanel title={locale === "it" ? "Problema segnalato" : "客户反馈问题"}>
          <dl className="grid gap-3 text-sm">
            <InfoRow label={locale === "it" ? "Numero RMA" : "RMA 编号"} value={rma.rmaNumber ?? "-"} />
            <InfoRow label="ID" value={rma.id} />
            <InfoRow label="Issue" value={rma.issueType} />
            <InfoRow
              label={locale === "it" ? "Test pre-installazione" : "安装前测试"}
              value={formatBoolean(rma.installationTested, locale)}
            />
            <InfoRow
              label={locale === "it" ? "Installato" : "是否已安装"}
              value={formatBoolean(rma.installed, locale)}
            />
            <InfoRow
              label={locale === "it" ? "Creato" : "提交时间"}
              value={new Date(rma.createdAt).toLocaleString(
                locale === "it" ? "it-IT" : "zh-CN",
              )}
            />
          </dl>
          <p className="mt-5 whitespace-pre-wrap rounded-lg bg-stone-50 p-4 text-sm font-medium leading-6 text-stone-700">
            {rma.description || (locale === "it" ? "Nessuna descrizione." : "无描述。")}
          </p>
        </AdminPanel>

        <div className="grid gap-3 xl:grid-cols-2">
          <AdminPanel
            title={locale === "it" ? "Esito pratica" : "处理结果"}
            description={
              locale === "it"
                ? "Risultato operativo, rimborso o sostituzione."
                : "记录退款、换货、拒绝或维修处理结果。"
            }
          >
            <dl className="grid gap-3 text-sm">
              <InfoRow label={locale === "it" ? "Tipo esito" : "处理类型"} value={rma.resolutionType ?? "-"} />
              <InfoRow label={locale === "it" ? "SKU sostitutivo" : "换货 SKU"} value={rma.replacementSku ?? "-"} />
              <InfoRow
                label={locale === "it" ? "Rimborso" : "退款金额"}
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
              <p className="mt-4 whitespace-pre-wrap rounded-lg bg-stone-50 p-3 text-sm font-medium leading-6 text-stone-700">
                {rma.resolutionNote}
              </p>
            ) : null}
          </AdminPanel>

          <AdminPanel
            title={locale === "it" ? "Timeline RMA" : "售后时间线"}
            description={
              locale === "it"
                ? "Storico delle azioni sulla pratica."
                : "记录售后提交、状态流转和处理动作。"
            }
          >
            {rma.events.length > 0 ? (
              <ol className="grid gap-2">
                {rma.events.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-lg border border-black/5 bg-white p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-black text-stone-950">{event.title}</p>
                      <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-black text-stone-500">
                        {event.eventType}
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
                  : "后续售后操作会自动写入这里。"}
              </p>
            )}
          </AdminPanel>
        </div>

        <AdminPanel
          title={locale === "it" ? "Allegati pratica" : "售后附件"}
          description={
            locale === "it"
              ? "Foto, video, ricevute o documenti collegati alla pratica."
              : "与该售后相关的照片、视频、收据或文件。"
          }
        >
          {rma.attachments.length ? (
            <div className="grid gap-2 md:grid-cols-2">
              {rma.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  className="rounded-lg border border-black/5 bg-stone-50 p-3 text-sm transition hover:border-blue-200 hover:bg-blue-50"
                  href={attachment.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="block font-black text-stone-950">{attachment.label}</span>
                  {attachment.note ? (
                    <span className="mt-1 block text-xs font-semibold leading-5 text-stone-600">
                      {attachment.note}
                    </span>
                  ) : null}
                  <span className="mt-2 block text-xs font-semibold text-stone-400">
                    {attachment.createdAt ? formatDateTime(attachment.createdAt, locale) : "-"}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-stone-50 p-3 text-sm font-semibold text-stone-500">
              {locale === "it"
                ? "Nessun allegato collegato."
                : "暂无售后附件。"}
            </p>
          )}
        </AdminPanel>
      </AdminWorkspaceGrid>
    </div>
  );
}

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid gap-1 rounded-lg bg-stone-50 p-2.5 sm:grid-cols-[140px_1fr]">
      <dt className="font-black text-stone-500">{label}</dt>
      <dd className="break-words font-semibold text-stone-900">{value}</dd>
    </div>
  );
}

function ResolutionForm({
  rma,
  locale,
  returnTo,
}: Readonly<{
  rma: AdminRmaRow;
  locale: Locale;
  returnTo: string;
}>) {
  return (
    <form action="/api/admin/rma/resolution" className="grid gap-3" method="post">
      <AdminCsrfField />
      <input type="hidden" name="id" value={rma.id} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Tipo esito" : "处理类型"}
        <select
          className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          defaultValue={rma.resolutionType ?? "pending"}
          name="resolutionType"
        >
          <option value="pending">{locale === "it" ? "In attesa" : "待处理"}</option>
          <option value="repair">{locale === "it" ? "Riparazione" : "维修"}</option>
          <option value="replace">{locale === "it" ? "Sostituzione" : "换货"}</option>
          <option value="refund">{locale === "it" ? "Rimborso" : "退款"}</option>
          <option value="credit_note">
            {locale === "it" ? "Nota di credito" : "贷记/抵扣"}
          </option>
          <option value="reject">{locale === "it" ? "Rifiuto" : "拒绝"}</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Importo rimborso" : "退款金额"}
        <input
          className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          defaultValue={rma.refundAmount ?? ""}
          min="0"
          name="refundAmount"
          placeholder="0.00"
          step="0.01"
          type="number"
        />
      </label>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "SKU sostitutivo" : "换货 SKU"}
        <input
          className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          defaultValue={rma.replacementSku ?? ""}
          name="replacementSku"
          placeholder="DCK-..."
        />
      </label>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Nota interna/cliente" : "处理说明"}
        <textarea
          className="min-h-24 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          defaultValue={rma.resolutionNote ?? ""}
          name="resolutionNote"
          placeholder={
            locale === "it"
              ? "Esito test, motivo e prossima azione"
              : "检测结果、处理原因和下一步"
          }
        />
      </label>
      <label className="flex items-center gap-2 rounded-lg bg-stone-50 p-2 text-xs font-bold text-stone-700">
        <input className="h-4 w-4" name="closeCase" type="checkbox" value="true" />
        {locale === "it" ? "Chiudi pratica come completata" : "同时关闭为已完成"}
      </label>
      <button
        className="inline-flex h-10 items-center justify-center rounded-lg border border-stone-950 bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800"
        type="submit"
      >
        {locale === "it" ? "Salva esito" : "保存处理结论"}
      </button>
    </form>
  );
}

function AttachmentForm({
  rma,
  locale,
  returnTo,
}: Readonly<{
  rma: AdminRmaRow;
  locale: Locale;
  returnTo: string;
}>) {
  return (
    <form
      action="/api/admin/rma/attachment"
      className="grid gap-3"
      encType="multipart/form-data"
      method="post"
    >
      <AdminCsrfField />
      <input type="hidden" name="id" value={rma.id} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Nome allegato" : "附件名称"}
        <input
          className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          name="label"
          placeholder={locale === "it" ? "Foto test / ricevuta" : "检测照片 / 退款凭证"}
          required
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
        {locale === "it" ? "Oppure URL allegato" : "或填写附件链接"}
        <input
          className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          name="url"
          placeholder="https://..."
          type="url"
        />
      </label>
      <label className="grid gap-1 text-xs font-black text-stone-500">
        {locale === "it" ? "Nota" : "说明"}
        <textarea
          className="min-h-20 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-stone-950 outline-none focus:border-blue-300"
          name="note"
          placeholder={locale === "it" ? "Visibile nel dettaglio RMA cliente" : "客户 RMA 详情页可见"}
        />
      </label>
      <button
        className="inline-flex h-10 items-center justify-center rounded-lg border border-stone-950 bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800"
        type="submit"
      >
        {locale === "it" ? "Aggiungi allegato" : "添加附件"}
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
          ? "Demo: stato RMA ricevuto."
          : "演示：已接收 RMA 状态。"
        : locale === "it"
          ? "RMA aggiornato."
          : "RMA 已更新。"}
    </AdminNotice>
  );
}

function formatBoolean(value: boolean | null | undefined, locale: Locale) {
  if (value === true) return locale === "it" ? "Si" : "是";
  if (value === false) return locale === "it" ? "No" : "否";
  return "-";
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale === "it" ? "it-IT" : "zh-CN");
}
