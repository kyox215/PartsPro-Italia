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
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminRecordList,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import { formatAdminCount, formatAdminStatus } from "@/lib/admin-display";
import { getCustomerAuditEvents, getAdminStaffRows } from "@/lib/admin-accounts";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { getAdminCustomerRows } from "@/lib/admin-customers";
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

  const [customers, staff, auditEvents] =
    !auth.configured || hasAdminPermission(auth, "accounts:read")
      ? await Promise.all([
          getAdminCustomerRows(),
          hasAdminPermission(auth, "staff:manage") ? getAdminStaffRows() : Promise.resolve([]),
          hasAdminPermission(auth, "audit:read") ? getCustomerAuditEvents(8) : Promise.resolve([]),
        ])
      : [[], [], []];

  const wholesaleCustomers = customers.filter((customer) => customer.priceGroup === "wholesale");
  const suspendedCustomers = customers.filter((customer) => customer.accountStatus !== "active");
  const pendingWholesale = customers.filter((customer) => customer.source === "application" || customer.crmStatus.includes("b2b_pending"));
  const totalSpent = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Area account" : "账号管理板块"}
        title={locale === "it" ? "Gestione account" : "账号管理"}
        description={
          locale === "it"
            ? "Clienti registrati, richieste wholesale, ruoli staff e audit in un solo pannello."
            : "集中处理已注册客户、批发申请、客户类型、员工角色和账号操作日志。"
        }
        actions={
          <AdminButtonLink href={localizePath(locale, "/admin/accounts/customers")} variant="secondary">
            {locale === "it" ? "Clienti" : "客户管理"}
          </AdminButtonLink>
        }
      />

      <AccountManagementTabs
        auth={auth}
        locale={locale}
        active="overview"
        counts={{
          customers: customers.length,
          staff: staff.length,
          audit: auditEvents.length,
        }}
      />

      <AdminWorkspaceGrid
        rail={
          <div className="grid gap-2">
            <AdminMetricCard icon={UsersRound} label={locale === "it" ? "Clienti" : "注册客户"} value={customers.length} tone="blue" />
            <AdminMetricCard icon={Building2} label={locale === "it" ? "Wholesale" : "批发客户"} value={wholesaleCustomers.length} tone="green" />
            <AdminMetricCard icon={ShieldCheck} label={locale === "it" ? "Staff attivi" : "员工账号"} value={staff.filter((item) => item.status === "active").length} tone="violet" />
            <AdminMetricCard icon={BadgeCheck} label={locale === "it" ? "Spesa totale" : "历史总额"} value={formatMoney(totalSpent, locale)} tone="amber" />
          </div>
        }
      >
        <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            icon={ClipboardList}
            label={locale === "it" ? "Richieste wholesale" : "待处理批发申请"}
            value={pendingWholesale.length}
            tone="amber"
            caption={locale === "it" ? "Gestite dai clienti" : "在客户管理中处理"}
          />
          <AdminMetricCard
            icon={UsersRound}
            label={locale === "it" ? "Clienti retail" : "零售客户"}
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
              href={localizePath(locale, "/admin/accounts/customers?filter=wholesale_pending")}
              title={locale === "it" ? "Richieste wholesale" : "批发申请"}
              value={pendingWholesale.length}
              label={locale === "it" ? "Apri clienti" : "打开客户队列"}
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
          toolbar={<StatusPill status={formatAdminCount(auditEvents.length, "events", locale)} tone="blue" />}
        >
          <AdminRecordList>
            {auditEvents.map((event) => {
              const action = formatAdminStatus("auditAction", event.action, locale);
              return (
                <article key={event.id} className="grid min-w-0 gap-2 rounded-lg bg-stone-50 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <StatusPill status={action.label} tone={action.tone} />
                    <p className="mt-2 break-words text-xs font-semibold text-stone-500">
                      {event.actorEmail ?? "-"} · {event.companyId ?? event.customerProfileId ?? event.applicationId ?? "-"}
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-stone-500 md:text-right">
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
