import { notFound } from "next/navigation";
import { ClipboardList, PackageCheck, RotateCcw, Wrench } from "lucide-react";
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
import { getAdminRmaById } from "@/lib/admin-operations";
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
