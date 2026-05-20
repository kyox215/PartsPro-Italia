import {
  BadgeCheck,
  Building2,
  ClipboardList,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";
import { AccountManagementTabs } from "@/components/admin/account-management-nav";
import {
  AdminButtonLink,
  AdminDataTable,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import { getCustomerAuditEvents, getAdminStaffRows } from "@/lib/admin-accounts";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { getAdminCustomerRows } from "@/lib/admin-customers";
import { getAdminB2BApplicationRows } from "@/lib/admin-operations";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

export default async function AdminAccountsPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const auth = await getAuthContext();

  const [customers, applications, staff, auditEvents] =
    !auth.configured || hasAdminPermission(auth, "accounts:read")
      ? await Promise.all([
          getAdminCustomerRows(),
          hasAdminPermission(auth, "b2b:review") ? getAdminB2BApplicationRows() : Promise.resolve([]),
          hasAdminPermission(auth, "staff:manage") ? getAdminStaffRows() : Promise.resolve([]),
          hasAdminPermission(auth, "audit:read") ? getCustomerAuditEvents(8) : Promise.resolve([]),
        ])
      : [[], [], [], []];

  const b2bCustomers = customers.filter((customer) => customer.priceGroup !== "retail");
  const suspendedCustomers = customers.filter((customer) => customer.accountStatus !== "active");
  const pendingB2B = applications.filter((application) => application.status === "pending");
  const totalSpent = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Account workspace" : "账号管理板块"}
        title={locale === "it" ? "Gestione account" : "账号管理"}
        description={
          locale === "it"
            ? "Clienti registrati, revisioni B2B, ruoli staff e audit in un solo pannello."
            : "集中处理已注册客户、B2B 审核、客户权限、员工角色和账号操作日志。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin/accounts/customers")} variant="secondary">
              {locale === "it" ? "Clienti" : "客户管理"}
            </AdminButtonLink>
            <AdminButtonLink href={localizePath(locale, "/admin/accounts/b2b")} variant="secondary">
              {locale === "it" ? "B2B" : "B2B 审核"}
            </AdminButtonLink>
          </>
        }
      />

      <AccountManagementTabs
        auth={auth}
        locale={locale}
        active="overview"
        counts={{
          customers: customers.length,
          b2b: pendingB2B.length,
          staff: staff.length,
          audit: auditEvents.length,
        }}
      />

      <AdminWorkspaceGrid
        rail={
          <div className="grid gap-2">
            <AdminMetricCard icon={UsersRound} label={locale === "it" ? "Clienti" : "注册客户"} value={customers.length} tone="blue" />
            <AdminMetricCard icon={Building2} label="B2B" value={b2bCustomers.length} tone="green" />
            <AdminMetricCard icon={ShieldCheck} label={locale === "it" ? "Staff attivi" : "员工账号"} value={staff.filter((item) => item.status === "active").length} tone="violet" />
            <AdminMetricCard icon={BadgeCheck} label={locale === "it" ? "Spesa totale" : "历史总额"} value={formatMoney(totalSpent, locale)} tone="amber" />
          </div>
        }
      >
        <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            icon={ClipboardList}
            label={locale === "it" ? "B2B pending" : "待审核 B2B"}
            value={pendingB2B.length}
            tone="amber"
            caption={locale === "it" ? "Richieste da gestire" : "需要集中处理"}
          />
          <AdminMetricCard
            icon={UsersRound}
            label={locale === "it" ? "Retail" : "零售客户"}
            value={customers.filter((customer) => customer.priceGroup === "retail").length}
            tone="slate"
          />
          <AdminMetricCard
            icon={ShieldCheck}
            label={locale === "it" ? "Sospesi" : "已暂停/归档"}
            value={suspendedCustomers.length}
            tone={suspendedCustomers.length ? "red" : "green"}
          />
          <AdminMetricCard
            icon={UserCog}
            label={locale === "it" ? "Audit recenti" : "最近操作"}
            value={auditEvents.length}
            tone="violet"
          />
        </section>

        <AdminPanel
          title={locale === "it" ? "Code account" : "账号待处理"}
          description={locale === "it" ? "Le azioni piu importanti del pannello account." : "账号管理板块里的关键待处理事项。"}
        >
          <div className="grid gap-2 md:grid-cols-3">
            <QuickAction
              href={localizePath(locale, "/admin/accounts/b2b?filter=pending")}
              title={locale === "it" ? "Revisioni B2B" : "B2B 待审核"}
              value={pendingB2B.length}
              label={locale === "it" ? "Apri coda" : "打开审核队列"}
            />
            <QuickAction
              href={localizePath(locale, "/admin/accounts/customers?filter=registered")}
              title={locale === "it" ? "Registrati" : "已注册客户"}
              value={customers.length}
              label={locale === "it" ? "Gestisci clienti" : "集中管理客户"}
            />
            <QuickAction
              href={localizePath(locale, "/admin/accounts/permissions")}
              title={locale === "it" ? "Ruoli staff" : "员工权限"}
              value={staff.length}
              label={locale === "it" ? "Configura" : "配置权限"}
            />
          </div>
        </AdminPanel>

        <AdminPanel
          title={locale === "it" ? "Audit account recente" : "最近账号操作"}
          toolbar={<StatusPill status={`${auditEvents.length} rows`} tone="blue" />}
        >
          <AdminDataTable minWidth={760}>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-stone-400">
                <tr className="border-b border-black/5">
                  <th className="px-2.5 py-2">Action</th>
                  <th className="px-2.5 py-2">Actor</th>
                  <th className="px-2.5 py-2">Target</th>
                  <th className="px-2.5 py-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {auditEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-stone-50">
                    <td className="px-2.5 py-2.5 font-black text-stone-950">{event.action}</td>
                    <td className="px-2.5 py-2.5 text-stone-600">{event.actorEmail ?? "-"}</td>
                    <td className="px-2.5 py-2.5 text-xs text-stone-500">{event.companyId ?? event.customerProfileId ?? event.applicationId ?? "-"}</td>
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

function QuickAction({
  href,
  title,
  value,
  label,
}: Readonly<{ href: string; title: string; value: number; label: string }>) {
  return (
    <a href={href} className="rounded-lg border border-black/5 bg-stone-50 p-3 transition hover:border-black/10 hover:bg-white">
      <p className="text-xs font-black uppercase text-stone-400">{title}</p>
      <p className="mt-2 text-2xl font-black leading-none text-stone-950">{value}</p>
      <p className="mt-2 text-xs font-black text-stone-600">{label}</p>
    </a>
  );
}
