import { CheckCircle2, Clock3, UsersRound, XCircle } from "lucide-react";
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
import { getAdminB2BApplicationRows } from "@/lib/admin-operations";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

const b2bStatuses = ["pending", "approved", "rejected"];

export default async function AdminB2BPage({
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
  const applications =
    !auth.configured || auth.isAdmin ? await getAdminB2BApplicationRows() : [];
  const saved = valueOf(query.saved);
  const error = valueOf(query.error);

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Customer components" : "客户审核组件"}
        title={locale === "it" ? "Revisioni account B2B" : "B2B 开户审核"}
        description={
          locale === "it"
            ? "Approva o rifiuta richieste wholesale e prepara assegnazione price group."
            : "审核批发开户注册申请，并准备分配价格组。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin/customers")} variant="secondary">
              {locale === "it" ? "Clienti CRM" : "客户管理"}
            </AdminButtonLink>
            <AdminButtonLink href={localizePath(locale, "/admin")} variant="secondary">
              {locale === "it" ? "Torna admin" : "返回后台"}
            </AdminButtonLink>
          </>
        }
      />

      <Feedback saved={saved} error={error} locale={locale} />

      <AdminWorkspaceGrid
        rail={
          <AdminActionRail
            title={locale === "it" ? "Stato B2B" : "B2B 状态"}
            description={locale === "it" ? "Code e decisioni" : "审核队列与结果"}
          >
            <section className="grid gap-2">
              <AdminMetricCard
                icon={Clock3}
                label={locale === "it" ? "Pending" : "待审核"}
                value={
                  applications.filter((application) => application.status === "pending")
                    .length
                }
                tone="amber"
              />
              <AdminMetricCard
                icon={CheckCircle2}
                label={locale === "it" ? "Approved" : "已通过"}
                value={
                  applications.filter((application) => application.status === "approved")
                    .length
                }
                tone="green"
              />
              <AdminMetricCard
                icon={XCircle}
                label={locale === "it" ? "Rejected" : "已拒绝"}
                value={
                  applications.filter((application) => application.status === "rejected")
                    .length
                }
                tone="red"
              />
            </section>
            <AdminPanel contentClassName="grid gap-2 p-2">
              <p className="text-xs font-semibold leading-5 text-stone-500">
                {locale === "it"
                  ? "Quando approvi una richiesta, viene creata o aggiornata la scheda cliente CRM e il price group viene sincronizzato sul profilo."
                  : "通过申请后会自动创建/更新客户 CRM 档案，并把价格组同步到用户档案。"}
              </p>
              <AdminButtonLink href={localizePath(locale, "/admin/customers")} variant="secondary">
                {locale === "it" ? "Apri clienti" : "查看客户管理"}
              </AdminButtonLink>
            </AdminPanel>
          </AdminActionRail>
        }
      >
        <AdminPanel
          title={locale === "it" ? "Richieste wholesale" : "批发申请"}
          description={
            locale === "it"
              ? "Righe dense con form status e campo price group."
              : "紧凑审核行，保留状态提交和 price group 字段。"
          }
        >
          {applications.length ? (
            <div className="grid gap-2">
              {applications.map((application) => (
                <article
                  key={application.id}
                  className="grid gap-3 rounded-lg border border-black/5 bg-stone-50 p-3 lg:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-black text-stone-950">
                        {application.companyName}
                      </p>
                      <StatusPill status={application.status} />
                    </div>
                    <p className="mt-1 text-sm font-semibold text-stone-600">
                      {application.email ?? "-"} / {application.vatNumber ?? "-"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-500">
                      <span className="font-mono text-stone-400">{application.id}</span>
                      <span>{new Date(application.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <StatusSelectForm
                    action="/api/admin/b2b/status"
                    currentStatus={application.status}
                    extraFields={
                      <input
                        className="h-9 w-36 rounded-lg border border-black/10 bg-white px-2 text-xs font-black text-stone-700 outline-none transition focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10"
                        name="priceGroup"
                        placeholder="b2b_basic"
                      />
                    }
                    id={application.id}
                    locale={locale}
                    statuses={b2bStatuses}
                  />
                </article>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              icon={UsersRound}
              title={locale === "it" ? "Nessuna richiesta B2B" : "暂无 B2B 申请"}
              description={
                locale === "it"
                  ? "Le nuove richieste compariranno qui appena inviate."
                  : "新的批发开户申请提交后会显示在这里。"
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
          ? "Demo: richiesta aggiornata localmente."
          : "演示：已接收审核动作。"
        : locale === "it"
          ? "Richiesta aggiornata e scheda CRM sincronizzata se approvata."
          : "申请已更新；如已通过，客户 CRM 档案已同步。"}
    </AdminNotice>
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
