import { redirect } from "next/navigation";
import { Activity, ShieldCheck } from "lucide-react";
import { AccountManagementTabs } from "@/components/admin/account-management-nav";
import {
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminRecordList,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import { getCustomerAuditEvents } from "@/lib/admin-accounts";
import { formatAdminStatus, formatAuditDataSummary } from "@/lib/admin-display";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AdminAccountAuditLogPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const auth = await getAuthContext();
  if (auth.configured && !hasAdminPermission(auth, "audit:read")) {
    redirect(localizePath(locale, "/admin/accounts?error=permission-denied"));
  }
  const events = await getCustomerAuditEvents(120);
  const uniqueActors = new Set(events.map((event) => event.actorEmail).filter(Boolean));

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Area account" : "账号管理"}
        title={locale === "it" ? "Audit account" : "账号操作日志"}
        description={
          locale === "it"
            ? "Log delle modifiche a clienti, B2B e staff."
            : "记录客户权限、B2B 审核、员工权限等账号相关操作。"
        }
      />

      <AccountManagementTabs auth={auth} locale={locale} active="audit" counts={{ audit: events.length }} />

      <AdminWorkspaceGrid
        rail={
          <div className="grid gap-2">
            <AdminMetricCard icon={Activity} label={locale === "it" ? "Eventi" : "日志数"} value={events.length} tone="blue" />
            <AdminMetricCard icon={ShieldCheck} label={locale === "it" ? "Operatori" : "操作人员"} value={uniqueActors.size} tone="violet" />
          </div>
        }
      >
        <AdminPanel title={locale === "it" ? "Log recenti" : "最近账号日志"}>
          <AdminRecordList>
            {events.map((event) => {
              const action = formatAdminStatus("auditAction", event.action, locale);
              const target = event.companyId ?? event.customerProfileId ?? event.applicationId ?? "-";
              return (
                <article key={event.id} className="grid min-w-0 gap-3 rounded-lg bg-stone-50 p-3 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <StatusPill status={action.label} tone={action.tone} />
                    <p className="mt-2 break-words text-xs font-semibold text-stone-500">
                      {locale === "it" ? "Operatore" : "操作人"}: {event.actorEmail ?? "-"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="break-words font-mono text-xs font-semibold text-stone-500">
                      {locale === "it" ? "Oggetto" : "对象"}: {target}
                    </p>
                    <p className="mt-1 line-clamp-2 break-words text-xs font-semibold text-stone-600">
                      {formatAuditDataSummary(event.afterData, locale)}
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-stone-500 lg:text-right">
                    {new Date(event.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}
                  </p>
                </article>
              );
            })}
          </AdminRecordList>
        </AdminPanel>
      </AdminWorkspaceGrid>
    </div>
  );
}
