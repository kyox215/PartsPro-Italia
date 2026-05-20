import { CheckCircle2, Clock3, UsersRound, XCircle } from "lucide-react";
import { StatusSelectForm } from "@/components/admin/status-select-form";
import {
  AdminButtonLink,
  AdminEmptyState,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
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
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Customer components" : "客户审核组件"}
        title={locale === "it" ? "Revisioni account B2B" : "B2B 开户审核"}
        description={
          locale === "it"
            ? "Approva o rifiuta richieste wholesale e prepara assegnazione price group."
            : "审核批发开户注册申请，并准备分配价格组。"
        }
        actions={
          <AdminButtonLink href={localizePath(locale, "/admin")} variant="secondary">
            {locale === "it" ? "Torna admin" : "返回后台"}
          </AdminButtonLink>
        }
      />

      <Feedback saved={saved} error={error} locale={locale} />

      <section className="grid gap-4 md:grid-cols-3">
        <AdminMetricCard
          icon={Clock3}
          label={locale === "it" ? "Pending" : "待审核"}
          value={applications.filter((application) => application.status === "pending").length}
          tone="amber"
        />
        <AdminMetricCard
          icon={CheckCircle2}
          label={locale === "it" ? "Approved" : "已通过"}
          value={applications.filter((application) => application.status === "approved").length}
          tone="green"
        />
        <AdminMetricCard
          icon={XCircle}
          label={locale === "it" ? "Rejected" : "已拒绝"}
          value={applications.filter((application) => application.status === "rejected").length}
          tone="red"
        />
      </section>

      <AdminPanel
        title={locale === "it" ? "Richieste wholesale" : "批发申请"}
        description={
          locale === "it"
            ? "Ogni riga mantiene il form status esistente e il campo price group."
            : "每一行保留原有状态提交表单和 price group 字段。"
        }
      >
        {applications.length ? (
          <div className="grid gap-3">
            {applications.map((application) => (
              <article
                key={application.id}
                className="grid gap-4 rounded-lg border border-black/5 bg-stone-50 p-4 lg:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-lg font-black text-stone-950">
                      {application.companyName}
                    </p>
                    <StatusPill status={application.status} />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-stone-600">
                    {application.email ?? "-"} / {application.vatNumber ?? "-"}
                  </p>
                  <p className="mt-2 font-mono text-xs font-semibold text-stone-400">
                    {application.id}
                  </p>
                  <p className="mt-2 text-xs font-medium text-stone-500">
                    {new Date(application.createdAt).toLocaleString()}
                  </p>
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
          ? "Richiesta aggiornata."
          : "申请已更新。"}
    </AdminNotice>
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
