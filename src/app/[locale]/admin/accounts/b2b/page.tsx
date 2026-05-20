import { CheckCircle2, Clock3, UsersRound, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { AccountManagementTabs } from "@/components/admin/account-management-nav";
import { StatusSelectForm } from "@/components/admin/status-select-form";
import {
  approvedB2BPriceGroupOptions,
  b2bStatusOptions,
  formatAdminStatus,
} from "@/lib/admin-display";
import {
  AdminActionRail,
  AdminButtonLink,
  AdminEmptyState,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminTabs,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { getAdminB2BApplicationRows } from "@/lib/admin-operations";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AdminAccountsB2BPage({
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
  if (auth.configured && !hasAdminPermission(auth, "b2b:review")) {
    redirect(localizePath(locale, "/admin/accounts?error=permission-denied"));
  }
  const applications =
    !auth.configured || hasAdminPermission(auth, "b2b:review")
      ? await getAdminB2BApplicationRows()
      : [];
  const filter = valueOf(query.filter) ?? "all";
  const visibleApplications =
    filter === "all"
      ? applications
      : applications.filter((application) => application.status === filter);
  const saved = valueOf(query.saved);
  const error = valueOf(query.error);
  const counts = {
    all: applications.length,
    pending: applications.filter((application) => application.status === "pending").length,
    approved: applications.filter((application) => application.status === "approved").length,
    rejected: applications.filter((application) => application.status === "rejected").length,
  };

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Area account" : "账号管理"}
        title={locale === "it" ? "Revisioni account B2B" : "B2B 开户审核"}
        description={
          locale === "it"
            ? "Approva o rifiuta richieste wholesale, sincronizzando cliente, azienda e gruppo prezzi."
            : "审核批发申请，并同步客户账号、公司档案和价格组。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin/accounts/customers")} variant="secondary">
              {locale === "it" ? "Clienti" : "客户管理"}
            </AdminButtonLink>
            <AdminButtonLink href={localizePath(locale, "/admin/accounts")} variant="secondary">
              {locale === "it" ? "Panoramica" : "账号总览"}
            </AdminButtonLink>
          </>
        }
      />

      <AccountManagementTabs auth={auth} locale={locale} active="b2b" counts={{ b2b: counts.pending }} />
      <Feedback saved={saved} error={error} locale={locale} />

      <AdminWorkspaceGrid
        rail={
          <AdminActionRail
            title={locale === "it" ? "Stato B2B" : "B2B 状态"}
            description={locale === "it" ? "Code e decisioni" : "审核队列与结果"}
          >
            <section className="grid gap-2">
              <AdminMetricCard icon={Clock3} label={formatAdminStatus("b2bApplication", "pending", locale).label} value={counts.pending} tone="amber" />
              <AdminMetricCard icon={CheckCircle2} label={formatAdminStatus("b2bApplication", "approved", locale).label} value={counts.approved} tone="green" />
              <AdminMetricCard icon={XCircle} label={formatAdminStatus("b2bApplication", "rejected", locale).label} value={counts.rejected} tone="red" />
            </section>
            <AdminPanel contentClassName="grid gap-2 p-2">
              <p className="text-xs font-semibold leading-5 text-stone-500">
                {locale === "it"
                  ? "Quando approvi, il sistema crea o collega l'azienda, aggiorna il ruolo profilo e scrive l'audit."
                  : "通过后系统会创建/关联公司，更新客户角色和价格组，并写入账号操作日志。"}
              </p>
              <AdminButtonLink href={localizePath(locale, "/admin/accounts/customers")} variant="secondary">
                {locale === "it" ? "Apri clienti" : "查看客户管理"}
              </AdminButtonLink>
            </AdminPanel>
          </AdminActionRail>
        }
      >
        <AdminTabs
          items={[
            ["all", locale === "it" ? "Tutte" : "全部"],
            ["pending", formatAdminStatus("b2bApplication", "pending", locale).label],
            ["approved", formatAdminStatus("b2bApplication", "approved", locale).label],
            ["rejected", formatAdminStatus("b2bApplication", "rejected", locale).label],
          ].map(([value, label]) => ({
            href: `${localizePath(locale, "/admin/accounts/b2b")}${value === "all" ? "" : `?filter=${value}`}`,
            label,
            active: filter === value,
            count: counts[value as keyof typeof counts],
          }))}
        />

        <AdminPanel
          title={locale === "it" ? "Richieste wholesale" : "批发申请"}
          description={
            locale === "it"
              ? "Le richieste duplicate per email e VAT vengono raggruppate nella riga piu recente."
              : "同一邮箱和 VAT 的重复申请会合并显示，以最新一条作为处理入口。"
          }
        >
          {visibleApplications.length ? (
            <div className="grid gap-2">
              {visibleApplications.map((application) => (
                <article
                  key={application.id}
                  className="grid gap-3 rounded-lg border border-black/5 bg-stone-50 p-3 lg:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-black text-stone-950">
                        {application.companyName}
                      </p>
                      <StatusPill
                        status={formatAdminStatus("b2bApplication", application.status, locale).label}
                        tone={formatAdminStatus("b2bApplication", application.status, locale).tone}
                      />
                      {(application.duplicateCount ?? 1) > 1 ? (
                        <StatusPill status={`x${application.duplicateCount}`} tone="amber" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-stone-600">
                      {application.email ?? "-"} / {application.vatNumber ?? "-"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-500">
                      <span className="font-mono text-stone-400">{application.id}</span>
                      <span>{new Date(application.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}</span>
                    </div>
                  </div>
                  <StatusSelectForm
                    action="/api/admin/accounts/b2b/status"
                    currentStatus={application.status}
                    extraFields={
                      <select
                        className="h-9 w-40 rounded-lg border border-black/10 bg-white px-2 text-xs font-black text-stone-700 outline-none transition focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10"
                        name="priceGroup"
                        defaultValue="b2b_basic"
                      >
                        {approvedB2BPriceGroupOptions.map((group) => (
                          <option key={group} value={group}>
                            {formatAdminStatus("priceGroup", group, locale).label}
                          </option>
                        ))}
                      </select>
                    }
                    id={application.id}
                    locale={locale}
                    statuses={[...b2bStatusOptions]}
                    statusLabels={Object.fromEntries(
                      b2bStatusOptions.map((status) => [
                        status,
                        formatAdminStatus("b2bApplication", status, locale).label,
                      ]),
                    )}
                    submitLabel={locale === "it" ? "Salva" : "保存"}
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
          ? "Richiesta aggiornata e scheda cliente sincronizzata."
          : "申请已更新，客户账号与公司档案已同步。"}
    </AdminNotice>
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
