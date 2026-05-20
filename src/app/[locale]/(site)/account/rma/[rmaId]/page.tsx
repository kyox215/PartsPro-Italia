import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getAccountRmaById } from "@/lib/account-activity";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AccountRmaDetailPage({
  params,
}: Readonly<{ params: Promise<{ locale: string; rmaId: string }> }>) {
  const { locale: rawLocale, rmaId: rawRmaId } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const rmaId = decodeURIComponent(rawRmaId);
  const auth = await getAuthContext();
  const rma = await getAccountRmaById(auth, rmaId);

  if (!rma) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-orange-200 bg-orange-50 text-orange-700">RMA</Badge>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <h1 className="break-all font-mono text-2xl font-bold text-slate-950">
              {rma.rmaNumber ?? rma.id}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {locale === "it"
                ? "Stato pratica, SKU coinvolto e descrizione del problema inviati al team post-vendita."
                : "查看售后状态、关联 SKU 和提交给售后团队的问题描述。"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={localizePath(locale, "/account/rma")} variant="secondary">
              {locale === "it" ? "Torna RMA" : "返回售后"}
            </ButtonLink>
            <ButtonLink
              href={`${localizePath(locale, "/rma")}?orderNumber=${encodeURIComponent(rma.orderNumber)}&sku=${encodeURIComponent(rma.sku)}&quantity=${rma.quantity}`}
              variant="secondary"
            >
              {locale === "it" ? "Nuova pratica" : "再次申请"}
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={locale === "it" ? "Stato" : "处理状态"} value={rma.status} />
        <MetricCard label={locale === "it" ? "Ordine" : "关联订单"} value={rma.orderNumber} />
        <MetricCard label="SKU" value={rma.sku} />
        <MetricCard
          label={locale === "it" ? "Problema" : "问题类型"}
          value={`${rma.issueType} x ${rma.quantity}`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Esito e prossima azione" : "处理结果与下一步"}
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <InfoRow label={locale === "it" ? "Numero RMA" : "RMA 编号"} value={rma.rmaNumber ?? "-"} />
            <InfoRow label={locale === "it" ? "Tipo esito" : "处理类型"} value={rma.resolutionType ?? "-"} />
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

        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Timeline" : "售后进度"}
          </h2>
          {rma.events.length ? (
            <ol className="mt-4 grid gap-3">
              {rma.events.map((event) => (
                <li key={event.id} className="rounded-lg bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-slate-950">{event.title}</p>
                    <Badge className="border-slate-200 bg-white text-slate-600">
                      {event.eventType}
                    </Badge>
                  </div>
                  {event.body ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">{event.body}</p>
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
                ? "Gli aggiornamenti della pratica appariranno qui."
                : "售后团队更新后会显示在这里。"}
            </p>
          )}
        </article>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-950">
          {locale === "it" ? "Descrizione" : "问题描述"}
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

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid gap-1 rounded-lg bg-slate-50 p-2.5 sm:grid-cols-[128px_1fr]">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="break-words font-bold text-slate-950">{value}</dd>
    </div>
  );
}

function formatDateTime(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale === "it" ? "it-IT" : "zh-CN");
}

function MetricCard({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 break-words text-xl font-bold text-slate-950">{value}</p>
    </article>
  );
}
