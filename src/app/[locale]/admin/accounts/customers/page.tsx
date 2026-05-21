import { Building2, Clock3, Euro, ShieldAlert, UsersRound, type LucideIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { AccountManagementTabs } from "@/components/admin/account-management-nav";
import {
  AdminActionRail,
  AdminButtonLink,
  AdminDataTable,
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminTabs,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import {
  formatAdminCount,
  formatAdminStatus,
  formatCustomerType,
} from "@/lib/admin-display";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { getAdminCustomerRows, type AdminCustomerRow } from "@/lib/admin-customers";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

export default async function AdminAccountCustomersPage({
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
  if (auth.configured && !hasAdminPermission(auth, "accounts:read")) {
    redirect(localizePath(locale, "/admin/accounts?error=permission-denied"));
  }

  const customers =
    !auth.configured || hasAdminPermission(auth, "accounts:read")
      ? await getAdminCustomerRows()
      : [];
  const filter = valueOf(query.filter) ?? "all";
  const visibleCustomers = filterCustomers(customers, filter)
    .sort((a, b) => b.totalSpent - a.totalSpent || b.orderCount - a.orderCount);
  const customerCounts = getCustomerFilterCounts(customers);
  const totalSpent = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const filterItems = [
    ["all", locale === "it" ? "Tutti" : "全部"],
    ["registered", locale === "it" ? "Registrati" : "已注册"],
    ["retail", locale === "it" ? "Clienti retail" : "零售客户"],
    ["wholesale", locale === "it" ? "Clienti wholesale" : "批发客户"],
    ["incomplete", locale === "it" ? "Profili incompleti" : "资料待完善"],
    ["staff", locale === "it" ? "Staff" : "员工账号"],
    ["suspended", locale === "it" ? "Sospesi/archiviati" : "暂停/归档"],
  ].map(([value, label]) => ({
    href: `${localizePath(locale, "/admin/accounts/customers")}${value === "all" ? "" : `?filter=${value}`}`,
    label,
    active: filter === value,
    count: customerCounts[value] ?? 0,
  }));

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Area account" : "账号管理"}
        title={locale === "it" ? "Gestione clienti" : "客户管理"}
        description={
          locale === "it"
            ? "Account registrati, aziende, price group, ordini e ruoli staff."
            : "集中显示注册用户、公司资料、价格权限、订单和员工权限。"
        }
        actions={
          <AdminButtonLink href={localizePath(locale, "/admin/accounts/permissions")} variant="secondary">
            {locale === "it" ? "Permessi" : "权限管理"}
          </AdminButtonLink>
        }
      />

      <AccountManagementTabs
        auth={auth}
        locale={locale}
        active="customers"
        counts={{ customers: customers.length }}
      />

      <AdminWorkspaceGrid
        rail={
          <AdminActionRail
            title={locale === "it" ? "Sintesi account" : "账号摘要"}
            description={locale === "it" ? "Code operative" : "客户队列"}
          >
            <section className="grid gap-2">
              <SummaryLink
                href={localizePath(locale, "/admin/accounts/customers")}
                icon={UsersRound}
                label={locale === "it" ? "Registrati" : "注册客户"}
                value={customerCounts.registered}
                tone="blue"
              />
              <SummaryLink
                href={localizePath(locale, "/admin/accounts/customers?filter=wholesale")}
                icon={Building2}
                label={locale === "it" ? "Wholesale" : "批发客户"}
                value={customerCounts.wholesale}
                tone="green"
              />
              <SummaryLink
                href={localizePath(locale, "/admin/accounts/customers?filter=suspended")}
                icon={ShieldAlert}
                label={locale === "it" ? "Sospesi/archiviati" : "暂停/归档"}
                value={customerCounts.suspended}
                tone={customerCounts.suspended ? "red" : "green"}
              />
              <SummaryLink
                href={localizePath(locale, "/admin/accounts/customers?filter=staff")}
                icon={Clock3}
                label={locale === "it" ? "Staff" : "员工账号"}
                value={customerCounts.staff}
                tone="amber"
              />
              <AdminMetricCard
                icon={Euro}
                label={locale === "it" ? "Valore ordini" : "历史成交额"}
                value={formatMoney(totalSpent, locale)}
                tone="violet"
              />
            </section>
          </AdminActionRail>
        }
      >
        <AdminTabs items={filterItems} wrap />

        <AdminPanel
          title={locale === "it" ? "Clienti e account" : "客户与账号"}
          toolbar={
            <StatusPill
              status={formatAdminCount(visibleCustomers.length, "customers", locale)}
              tone="blue"
            />
          }
        >
          {visibleCustomers.length ? (
            <AdminDataTable minWidth={1080}>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                  <tr className="border-b border-slate-100">
                    <th className="px-3 py-3">{locale === "it" ? "Cliente" : "客户/联系方式"}</th>
                    <th className="px-3 py-3">{locale === "it" ? "Tipo" : "客户类型"}</th>
                    <th className="px-3 py-3">{locale === "it" ? "Fatturato" : "成交额"}</th>
                    <th className="px-3 py-3">{locale === "it" ? "Ordini" : "订单数"}</th>
                    <th className="px-3 py-3">{locale === "it" ? "Ultimo contatto" : "最近跟进"}</th>
                    <th className="px-3 py-3">{locale === "it" ? "Tag" : "常买/标签"}</th>
                    <th className="px-3 py-3">{locale === "it" ? "Stato" : "状态"}</th>
                    <th className="px-3 py-3">{locale === "it" ? "Azione" : "操作"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleCustomers.map((customer) => (
                    <CustomerTableRow
                      key={`${customer.source}-${customer.id}`}
                      customer={customer}
                      locale={locale}
                    />
                  ))}
                </tbody>
              </table>
            </AdminDataTable>
          ) : (
            <AdminEmptyState
              icon={UsersRound}
              title={locale === "it" ? "Nessun cliente" : "暂无客户"}
              description={
                locale === "it"
                  ? "Gli account registrati e le aziende appariranno qui."
                  : "注册用户和公司资料都会显示在这里。"
              }
            />
          )}
        </AdminPanel>
      </AdminWorkspaceGrid>
    </div>
  );
}

function CustomerTableRow({
  customer,
  locale,
}: Readonly<{ customer: AdminCustomerRow; locale: Locale }>) {
  const source = formatAdminStatus("customerSource", customer.source, locale);
  const account = formatAdminStatus("account", customer.accountStatus, locale);
  const crm = formatAdminStatus("crm", customer.crmStatus, locale);
  const priceGroup = formatCustomerType(customer.priceGroup, locale);
  const nextAction = getCustomerNextAction(customer, locale);

  return (
    <tr className="hover:bg-blue-50/40">
      <td className="px-3 py-3">
        <p className="font-black text-slate-950">{customer.companyName}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {[customer.contactName, customer.phone, customer.whatsapp, customer.email].filter(Boolean).join(" / ") || "-"}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-400">{customer.vatNumber ?? source.label}</p>
      </td>
      <td className="px-3 py-3"><StatusPill status={priceGroup.label} tone={priceGroup.tone} /></td>
      <td className="px-3 py-3 font-black text-slate-950">{formatMoney(customer.totalSpent, locale)}</td>
      <td className="px-3 py-3 font-black text-slate-950">{customer.orderCount}</td>
      <td className="px-3 py-3 text-xs font-semibold text-slate-500">
        {customer.lastContactedAt
          ? new Date(customer.lastContactedAt).toLocaleDateString(locale === "it" ? "it-IT" : "zh-CN")
          : customer.nextFollowUpAt
            ? new Date(customer.nextFollowUpAt).toLocaleDateString(locale === "it" ? "it-IT" : "zh-CN")
            : "-"}
      </td>
      <td className="px-3 py-3">
        <div className="flex max-w-[240px] flex-wrap gap-1">
          {(customer.tags.length ? customer.tags : [crm.label]).slice(0, 3).map((tag) => (
            <StatusPill key={tag} status={tag} tone="slate" />
          ))}
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          <StatusPill status={account.label} tone={account.tone} />
          <StatusPill status={crm.label} tone={crm.tone} />
        </div>
      </td>
      <td className="px-3 py-3">
        <AdminButtonLink href={nextAction.href} variant="secondary">
          {nextAction.button}
        </AdminButtonLink>
      </td>
    </tr>
  );
}

function SummaryLink({
  href,
  icon: Icon,
  label,
  value,
  tone,
}: Readonly<{
  href: string;
  icon: LucideIcon;
  label: string;
  value: number;
  tone: "blue" | "green" | "amber" | "red" | "violet" | "slate";
}>) {
  return (
    <a href={href} className="block">
      <AdminMetricCard icon={Icon} label={label} value={value} tone={tone} />
    </a>
  );
}

function getCustomerNextAction(customer: AdminCustomerRow, locale: Locale) {
  if (!customer.companyId) {
    return {
      label: locale === "it" ? "Collegare scheda azienda" : "补齐公司档案",
      button: locale === "it" ? "Apri" : "处理",
      href: localizePath(locale, `/admin/accounts/customers/${customer.id}`),
    };
  }
  if (customer.accountStatus !== "active" || customer.crmStatus === "paused") {
    return {
      label: locale === "it" ? "Verificare accesso cliente" : "检查账号权限",
      button: locale === "it" ? "Apri" : "查看",
      href: localizePath(locale, `/admin/accounts/customers/${customer.id}`),
    };
  }
  if (customer.pendingTaskCount > 0 || isFollowUpDue(customer.nextFollowUpAt)) {
    return {
      label: locale === "it" ? "Gestire follow-up" : "处理跟进任务",
      button: locale === "it" ? "Apri" : "跟进",
      href: localizePath(locale, `/admin/accounts/customers/${customer.id}`),
    };
  }
  return {
    label: locale === "it" ? "Scheda cliente aggiornata" : "查看客户详情",
    button: locale === "it" ? "Apri" : "详情",
    href: localizePath(locale, `/admin/accounts/customers/${customer.id}`),
  };
}

function filterCustomers(customers: AdminCustomerRow[], filter: string) {
  if (filter === "retail") return customers.filter((customer) => customer.priceGroup === "retail");
  if (filter === "registered") return customers.filter((customer) => customer.profileId);
  if (filter === "wholesale") return customers.filter(isWholesaleCustomer);
  if (filter === "incomplete") return customers.filter(isCompanyIncomplete);
  if (filter === "staff") return customers.filter(isStaffCustomer);
  if (filter === "suspended") return customers.filter(isSuspended);
  return customers;
}

function getCustomerFilterCounts(customers: AdminCustomerRow[]) {
  const counts: Record<string, number> = {
    all: customers.length,
    registered: 0,
    retail: 0,
    incomplete: 0,
    wholesale: 0,
    staff: 0,
    suspended: 0,
  };

  customers.forEach((customer) => {
    if (customer.profileId) counts.registered += 1;
    if (customer.priceGroup === "retail") counts.retail += 1;
    if (isCompanyIncomplete(customer)) counts.incomplete += 1;
    if (isWholesaleCustomer(customer)) counts.wholesale += 1;
    if (isStaffCustomer(customer)) counts.staff += 1;
    if (isSuspended(customer)) counts.suspended += 1;
  });

  return counts;
}

function isCompanyIncomplete(customer: AdminCustomerRow) {
  return !customer.companyId || !customer.vatNumber;
}

function isWholesaleCustomer(customer: AdminCustomerRow) {
  return customer.priceGroup === "wholesale";
}

function isStaffCustomer(customer: AdminCustomerRow) {
  return Boolean(customer.staffRole && customer.staffStatus === "active");
}

function isSuspended(customer: AdminCustomerRow) {
  return customer.accountStatus !== "active" || ["paused", "archived"].includes(customer.crmStatus);
}

function isFollowUpDue(value: string | null) {
  if (!value) return false;
  return new Date(value).getTime() <= Date.now();
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
