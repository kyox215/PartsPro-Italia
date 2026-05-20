import { CheckCircle2, Clock3, RotateCcw, Wrench } from "lucide-react";
import { StatusSelectForm } from "@/components/admin/status-select-form";
import {
  AdminActionRail,
  AdminButtonLink,
  AdminEmptyState,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import { getAdminRmaRows } from "@/lib/admin-operations";
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

export default async function AdminRmaPage({
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
  const rmas = !auth.configured || auth.isAdmin ? await getAdminRmaRows() : [];
  const saved = valueOf(query.saved);
  const error = valueOf(query.error);

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Refund request components" : "售后请求组件"}
        title={locale === "it" ? "Gestione RMA" : "RMA 售后管理"}
        description={
          locale === "it"
            ? "Controlla richieste post-vendita, SKU, quantita, problema e stato."
            : "查看售后申请、SKU、数量、问题类型并更新处理状态。"
        }
        actions={
          <AdminButtonLink href={localizePath(locale, "/admin")} variant="secondary">
            {locale === "it" ? "Torna admin" : "返回后台"}
          </AdminButtonLink>
        }
      />

      <Feedback saved={saved} error={error} locale={locale} />

      <AdminWorkspaceGrid
        rail={
          <AdminActionRail
            title={locale === "it" ? "Stato RMA" : "RMA 状态"}
            description={locale === "it" ? "Code tecniche" : "售后处理队列"}
          >
            <section className="grid gap-2">
              <AdminMetricCard
                icon={Clock3}
                label={locale === "it" ? "Aperti" : "待处理"}
                value={rmas.filter((rma) => rma.status !== "completed").length}
                tone="amber"
              />
              <AdminMetricCard
                icon={Wrench}
                label={locale === "it" ? "In test" : "检测中"}
                value={rmas.filter((rma) => rma.status === "testing").length}
                tone="blue"
              />
              <AdminMetricCard
                icon={CheckCircle2}
                label={locale === "it" ? "Completati" : "已完成"}
                value={rmas.filter((rma) => rma.status === "completed").length}
                tone="green"
              />
            </section>
          </AdminActionRail>
        }
      >
        <AdminPanel
          title={locale === "it" ? "Ticket RMA" : "RMA 工单"}
          description={
            locale === "it"
              ? "Lista operativa con stato, SKU e azione dettaglio."
              : "紧凑展示状态、SKU 和详情入口。"
          }
        >
          {rmas.length ? (
            <div className="grid gap-2">
              {rmas.map((rma) => (
                <article
                  key={rma.id}
                  className="grid gap-3 rounded-lg border border-black/5 bg-stone-50 p-3 xl:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-black text-stone-950">
                        {rma.orderNumber} / {rma.sku}
                      </p>
                      <StatusPill status={rma.status} />
                    </div>
                    <p className="mt-1 text-sm font-semibold text-stone-600">
                      {rma.issueType} x {rma.quantity}
                    </p>
                    <p className="mt-2 line-clamp-2 max-w-3xl text-xs font-medium leading-5 text-stone-600">
                      {rma.description || "-"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-black text-stone-500">
                      <span className="rounded-md bg-white px-2 py-1 shadow-sm">
                        {rma.installationTested
                          ? locale === "it"
                            ? "Testato"
                            : "已测试"
                          : locale === "it"
                            ? "Test n/d"
                            : "未记录测试"}
                      </span>
                      <span className="rounded-md bg-white px-2 py-1 shadow-sm">
                        {rma.installed
                          ? locale === "it"
                            ? "Installato"
                            : "已安装"
                          : locale === "it"
                            ? "Non installato"
                            : "未安装"}
                      </span>
                      <span className="rounded-md bg-white px-2 py-1 shadow-sm">
                        {new Date(rma.createdAt).toLocaleDateString()}
                      </span>
                      <span className="font-mono text-stone-400">{rma.id}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <StatusSelectForm
                      action="/api/admin/rma/status"
                      currentStatus={rma.status}
                      id={rma.id}
                      locale={locale}
                      statuses={rmaStatuses}
                    />
                    <AdminButtonLink
                      href={localizePath(locale, `/admin/rma/${rma.id}`)}
                      variant="secondary"
                    >
                      {locale === "it" ? "Apri" : "查看"}
                    </AdminButtonLink>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              icon={RotateCcw}
              title={locale === "it" ? "Nessun RMA aperto" : "暂无 RMA 工单"}
              description={
                locale === "it"
                  ? "Le richieste post-vendita appariranno qui."
                  : "售后申请提交后会显示在这里。"
              }
            />
          )}
        </AdminPanel>
      </AdminWorkspaceGrid>
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

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
