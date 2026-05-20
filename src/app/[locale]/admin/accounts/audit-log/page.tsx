import { redirect } from "next/navigation";
import { Activity, ShieldCheck } from "lucide-react";
import { AccountManagementTabs } from "@/components/admin/account-management-nav";
import {
  AdminDataTable,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import { getCustomerAuditEvents } from "@/lib/admin-accounts";
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
        eyebrow={locale === "it" ? "Account workspace" : "账号管理"}
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
          <AdminDataTable minWidth={1040}>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-stone-400">
                <tr className="border-b border-black/5">
                  <th className="px-2.5 py-2">Action</th>
                  <th className="px-2.5 py-2">Actor</th>
                  <th className="px-2.5 py-2">Customer</th>
                  <th className="px-2.5 py-2">Company</th>
                  <th className="px-2.5 py-2">Application</th>
                  <th className="px-2.5 py-2">After</th>
                  <th className="px-2.5 py-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-stone-50">
                    <td className="px-2.5 py-2.5"><StatusPill status={event.action} tone="blue" /></td>
                    <td className="px-2.5 py-2.5 text-stone-700">{event.actorEmail ?? "-"}</td>
                    <td className="px-2.5 py-2.5 font-mono text-xs text-stone-500">{event.customerProfileId ?? "-"}</td>
                    <td className="px-2.5 py-2.5 font-mono text-xs text-stone-500">{event.companyId ?? "-"}</td>
                    <td className="px-2.5 py-2.5 font-mono text-xs text-stone-500">{event.applicationId ?? "-"}</td>
                    <td className="max-w-[280px] px-2.5 py-2.5 text-xs text-stone-500">
                      <span className="line-clamp-2">{event.afterData ? JSON.stringify(event.afterData) : "-"}</span>
                    </td>
                    <td className="px-2.5 py-2.5 text-xs text-stone-500">{new Date(event.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminDataTable>
        </AdminPanel>
      </AdminWorkspaceGrid>
    </div>
  );
}
