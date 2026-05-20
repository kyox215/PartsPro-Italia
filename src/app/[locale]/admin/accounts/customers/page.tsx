import { Building2, Euro, ShieldAlert, UsersRound } from "lucide-react";
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
  const visibleCustomers = filterCustomers(customers, filter);
  const customerCounts = getCustomerFilterCounts(customers);
  const filterItems = [
    ["all", locale === "it" ? "Tutti" : "全部"],
    ["registered", locale === "it" ? "Registrati" : "已注册"],
    ["retail", locale === "it" ? "Retail" : "零售"],
    ["b2b_pending", locale === "it" ? "B2B pending" : "B2B 待审"],
    ["b2b", locale === "it" ? "B2B approvati" : "B2B 已通过"],
    ["suspended", locale === "it" ? "Sospesi" : "暂停/归档"],
    ["no_company", locale === "it" ? "Senza azienda" : "无公司资料"],
  ].map(([value, label]) => ({
    href: `${localizePath(locale, "/admin/accounts/customers")}${value === "all" ? "" : `?filter=${value}`}`,
    label,
    active: filter === value,
    count: customerCounts[value] ?? 0,
  }));

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Account workspace" : "账号管理"}
        title={locale === "it" ? "Clienti registrati" : "客户管理"}
        description={
          locale === "it"
            ? "Tutti gli utenti registrati, aziende, richieste B2B, ordini, RMA e permessi cliente."
            : "集中显示所有注册用户、公司资料、B2B 申请、订单、RMA 和客户权限。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin/accounts/b2b")} variant="secondary">
              {locale === "it" ? "B2B review" : "B2B 审核"}
            </AdminButtonLink>
            <AdminButtonLink href={localizePath(locale, "/admin/accounts/permissions")} variant="secondary">
              {locale === "it" ? "Permessi" : "权限管理"}
            </AdminButtonLink>
          </>
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
            description={locale === "it" ? "Clienti e accessi" : "客户与权限"}
          >
            <section className="grid gap-2">
              <AdminMetricCard icon={UsersRound} label={locale === "it" ? "Registrati" : "注册客户"} value={customers.filter((customer) => customer.profileId).length} tone="blue" />
              <AdminMetricCard icon={Building2} label="B2B" value={customerCounts.b2b} tone="green" />
              <AdminMetricCard icon={ShieldAlert} label={locale === "it" ? "Sospesi" : "暂停/归档"} value={customerCounts.suspended} tone={customerCounts.suspended ? "red" : "green"} />
              <AdminMetricCard icon={Euro} label={locale === "it" ? "Revenue" : "成交额"} value={formatMoney(customers.reduce((sum, customer) => sum + customer.totalSpent, 0), locale)} tone="violet" />
            </section>
          </AdminActionRail>
        }
      >
        <AdminTabs items={filterItems} />

        <AdminPanel
          title={locale === "it" ? "Clienti e account" : "客户与账号"}
          toolbar={<StatusPill status={`${visibleCustomers.length} rows`} tone="blue" />}
        >
          {visibleCustomers.length ? (
            <AdminDataTable
              minWidth={1120}
              mobileBreakpoint="lg"
              mobileCards={
                <div className="grid gap-2">
                  {visibleCustomers.map((customer) => (
                    <CustomerCard
                      key={`${customer.source}-${customer.id}`}
                      customer={customer}
                      locale={locale}
                    />
                  ))}
                </div>
              }
            >
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-stone-400">
                  <tr className="border-b border-black/5">
                    <th className="px-2.5 py-2">Customer</th>
                    <th className="px-2.5 py-2">Account</th>
                    <th className="px-2.5 py-2">CRM</th>
                    <th className="px-2.5 py-2">Price</th>
                    <th className="px-2.5 py-2">Orders</th>
                    <th className="px-2.5 py-2">RMA</th>
                    <th className="px-2.5 py-2">Next</th>
                    <th className="px-2.5 py-2">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {visibleCustomers.map((customer) => (
                    <tr key={`${customer.source}-${customer.id}`} className="hover:bg-stone-50">
                      <td className="px-2.5 py-2.5">
                        <p className="font-black text-stone-950">{customer.companyName}</p>
                        <p className="mt-1 text-xs font-semibold text-stone-500">{customer.email ?? customer.vatNumber ?? "-"}</p>
                      </td>
                      <td className="px-2.5 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          <StatusPill status={customer.source} tone={customer.source === "profile" ? "blue" : customer.source === "application" ? "amber" : "slate"} />
                          <StatusPill status={customer.accountStatus} />
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5"><StatusPill status={customer.crmStatus} /></td>
                      <td className="px-2.5 py-2.5"><StatusPill status={customer.priceGroup} tone={customer.priceGroup === "retail" ? "slate" : "green"} /></td>
                      <td className="px-2.5 py-2.5 font-black">{customer.orderCount} / {formatMoney(customer.totalSpent, locale)}</td>
                      <td className="px-2.5 py-2.5">{customer.rmaCount}</td>
                      <td className="px-2.5 py-2.5 text-xs text-stone-500">{customer.nextFollowUpAt ? new Date(customer.nextFollowUpAt).toLocaleDateString(locale === "it" ? "it-IT" : "zh-CN") : "-"}</td>
                      <td className="px-2.5 py-2.5">
                        {customer.source === "application" ? (
                          <AdminButtonLink href={localizePath(locale, "/admin/accounts/b2b")} variant="secondary">
                            {locale === "it" ? "Review" : "审核"}
                          </AdminButtonLink>
                        ) : (
                          <AdminButtonLink href={localizePath(locale, `/admin/accounts/customers/${customer.id}`)} variant="secondary">
                            {locale === "it" ? "Apri" : "详情"}
                          </AdminButtonLink>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminDataTable>
          ) : (
            <AdminEmptyState
              icon={UsersRound}
              title={locale === "it" ? "Nessun cliente" : "暂无客户"}
              description={locale === "it" ? "Gli utenti registrati e le richieste B2B appariranno qui." : "所有注册用户、公司资料和 B2B 申请都会显示在这里。"}
            />
          )}
        </AdminPanel>
      </AdminWorkspaceGrid>
    </div>
  );
}

function CustomerCard({
  customer,
  locale,
}: Readonly<{ customer: AdminCustomerRow; locale: Locale }>) {
  return (
    <article className="rounded-lg border border-black/5 bg-stone-50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-black text-stone-950">{customer.companyName}</p>
          <p className="mt-1 truncate text-xs font-semibold text-stone-500">{customer.email ?? "-"}</p>
        </div>
        <StatusPill status={customer.accountStatus} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <StatusPill status={customer.priceGroup} tone={customer.priceGroup === "retail" ? "slate" : "green"} />
        <StatusPill status={customer.crmStatus} tone="blue" />
        <StatusPill status={`${customer.orderCount} orders`} tone="blue" />
        {customer.pendingTaskCount ? <StatusPill status={`${customer.pendingTaskCount} tasks`} tone="amber" /> : null}
      </div>
      <div className="mt-3">
        {customer.source === "application" ? (
          <AdminButtonLink href={localizePath(locale, "/admin/accounts/b2b")} variant="secondary">
            {locale === "it" ? "Review" : "审核"}
          </AdminButtonLink>
        ) : (
          <AdminButtonLink href={localizePath(locale, `/admin/accounts/customers/${customer.id}`)} variant="secondary">
            {locale === "it" ? "Apri" : "详情"}
          </AdminButtonLink>
        )}
      </div>
    </article>
  );
}

function filterCustomers(customers: AdminCustomerRow[], filter: string) {
  if (filter === "registered") return customers.filter((customer) => Boolean(customer.profileId));
  if (filter === "retail") return customers.filter((customer) => customer.priceGroup === "retail");
  if (filter === "b2b_pending") return customers.filter((customer) => customer.crmStatus.includes("pending"));
  if (filter === "b2b") return customers.filter((customer) => customer.priceGroup !== "retail");
  if (filter === "suspended") return customers.filter((customer) => customer.accountStatus !== "active" || customer.crmStatus === "paused");
  if (filter === "no_company") return customers.filter((customer) => !customer.companyId && customer.source !== "application");
  return customers;
}

function getCustomerFilterCounts(customers: AdminCustomerRow[]) {
  const counts: Record<string, number> = {
    all: customers.length,
    registered: 0,
    retail: 0,
    b2b_pending: 0,
    b2b: 0,
    suspended: 0,
    no_company: 0,
  };

  customers.forEach((customer) => {
    if (customer.profileId) counts.registered += 1;
    if (customer.priceGroup === "retail") counts.retail += 1;
    if (customer.crmStatus.includes("pending")) counts.b2b_pending += 1;
    if (customer.priceGroup !== "retail") counts.b2b += 1;
    if (customer.accountStatus !== "active" || customer.crmStatus === "paused") counts.suspended += 1;
    if (!customer.companyId && customer.source !== "application") counts.no_company += 1;
  });

  return counts;
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
