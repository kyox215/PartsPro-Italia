import { Building2, Clock3, Euro, UsersRound } from "lucide-react";
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
import { getAdminCustomerRows, type AdminCustomerRow } from "@/lib/admin-customers";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

export default async function AdminCustomersPage({
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
  const customers = !auth.configured || auth.isAdmin ? await getAdminCustomerRows() : [];
  const filter = valueOf(query.filter) ?? "all";
  const visibleCustomers = filterCustomers(customers, filter);
  const filterItems = [
    ["all", locale === "it" ? "Tutti" : "全部"],
    ["lead", locale === "it" ? "Lead" : "线索"],
    ["active", locale === "it" ? "Attivi" : "活跃客户"],
    ["followup", locale === "it" ? "Follow-up" : "待跟进"],
    ["b2b", locale === "it" ? "B2B" : "B2B"],
  ].map(([value, label]) => ({
    href: `${localizePath(locale, "/admin/customers")}${value === "all" ? "" : `?filter=${value}`}`,
    label,
    active: filter === value,
    count: filterCustomers(customers, value).length,
  }));

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "CRM workspace" : "CRM 工作台"}
        title={locale === "it" ? "Gestione clienti" : "客户管理"}
        description={
          locale === "it"
            ? "Unisce aziende, richieste B2B, price group, ordini, RMA e follow-up."
            : "聚合公司档案、B2B 申请、价格组、订单、RMA 和跟进任务。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin/b2b")} variant="secondary">
              {locale === "it" ? "B2B review" : "B2B 审核"}
            </AdminButtonLink>
            <AdminButtonLink href={localizePath(locale, "/admin/orders")} variant="secondary">
              {locale === "it" ? "Ordini" : "订单"}
            </AdminButtonLink>
          </>
        }
      />

      <AdminWorkspaceGrid
        rail={
          <AdminActionRail
            title={locale === "it" ? "Sintesi clienti" : "客户摘要"}
            description={locale === "it" ? "CRM e code" : "CRM 与队列"}
          >
            <section className="grid gap-2">
              <AdminMetricCard icon={UsersRound} label={locale === "it" ? "Clienti" : "客户数"} value={customers.length} tone="blue" />
              <AdminMetricCard icon={Building2} label="B2B" value={customers.filter((customer) => customer.priceGroup !== "retail").length} tone="green" />
              <AdminMetricCard icon={Clock3} label={locale === "it" ? "Follow-up" : "待跟进"} value={customers.filter(needsFollowUp).length} tone="amber" />
              <AdminMetricCard icon={Euro} label={locale === "it" ? "Revenue" : "成交额"} value={formatMoney(customers.reduce((sum, customer) => sum + customer.totalSpent, 0), locale)} tone="violet" />
            </section>
          </AdminActionRail>
        }
      >
        <AdminTabs items={filterItems} />

        <AdminPanel
          title={locale === "it" ? "Clienti e lead" : "客户与线索"}
          toolbar={<StatusPill status={`${visibleCustomers.length} rows`} tone="blue" />}
        >
          {visibleCustomers.length ? (
            <>
              <div className="hidden lg:block">
                <AdminDataTable minWidth={1040}>
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-stone-400">
                      <tr className="border-b border-black/5">
                        <th className="px-2.5 py-2">Company</th>
                        <th className="px-2.5 py-2">Contact</th>
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
                            <p className="mt-1 text-xs font-semibold text-stone-500">{customer.vatNumber ?? "-"}</p>
                          </td>
                          <td className="px-2.5 py-2.5">
                            <p className="font-semibold text-stone-700">{customer.contactName ?? "-"}</p>
                            <p className="mt-1 text-xs text-stone-500">{customer.email ?? "-"}</p>
                          </td>
                          <td className="px-2.5 py-2.5"><StatusPill status={customer.crmStatus} /></td>
                          <td className="px-2.5 py-2.5"><StatusPill status={customer.priceGroup} tone={customer.priceGroup === "retail" ? "slate" : "green"} /></td>
                          <td className="px-2.5 py-2.5 font-black">{customer.orderCount} / {formatMoney(customer.totalSpent, locale)}</td>
                          <td className="px-2.5 py-2.5">{customer.rmaCount}</td>
                          <td className="px-2.5 py-2.5 text-xs text-stone-500">{customer.nextFollowUpAt ? new Date(customer.nextFollowUpAt).toLocaleDateString(locale === "it" ? "it-IT" : "zh-CN") : "-"}</td>
                          <td className="px-2.5 py-2.5">
                            {customer.source === "company" ? (
                              <AdminButtonLink href={localizePath(locale, `/admin/customers/${customer.id}`)} variant="secondary">
                                {locale === "it" ? "Apri" : "详情"}
                              </AdminButtonLink>
                            ) : (
                              <AdminButtonLink href={localizePath(locale, "/admin/b2b")} variant="secondary">
                                {locale === "it" ? "Review" : "审核"}
                              </AdminButtonLink>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </AdminDataTable>
              </div>
              <div className="grid gap-2 lg:hidden">
                {visibleCustomers.map((customer) => (
                  <CustomerCard key={`${customer.source}-${customer.id}`} customer={customer} locale={locale} />
                ))}
              </div>
            </>
          ) : (
            <AdminEmptyState
              icon={UsersRound}
              title={locale === "it" ? "Nessun cliente" : "暂无客户"}
              description={locale === "it" ? "Le aziende e i lead B2B appariranno qui." : "公司档案和 B2B 线索会显示在这里。"}
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
        <StatusPill status={customer.crmStatus} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <StatusPill status={customer.priceGroup} tone={customer.priceGroup === "retail" ? "slate" : "green"} />
        <StatusPill status={`${customer.orderCount} orders`} tone="blue" />
        {customer.pendingTaskCount ? <StatusPill status={`${customer.pendingTaskCount} tasks`} tone="amber" /> : null}
      </div>
      <div className="mt-3">
        {customer.source === "company" ? (
          <AdminButtonLink href={localizePath(locale, `/admin/customers/${customer.id}`)} variant="secondary">
            {locale === "it" ? "Apri" : "详情"}
          </AdminButtonLink>
        ) : (
          <AdminButtonLink href={localizePath(locale, "/admin/b2b")} variant="secondary">
            {locale === "it" ? "Review" : "审核"}
          </AdminButtonLink>
        )}
      </div>
    </article>
  );
}

function filterCustomers(customers: AdminCustomerRow[], filter: string) {
  if (filter === "lead") return customers.filter((customer) => customer.crmStatus.includes("lead") || customer.source === "application");
  if (filter === "active") return customers.filter((customer) => customer.crmStatus === "active");
  if (filter === "followup") return customers.filter(needsFollowUp);
  if (filter === "b2b") return customers.filter((customer) => customer.priceGroup !== "retail" || customer.source === "application");
  return customers;
}

function needsFollowUp(customer: AdminCustomerRow) {
  if (customer.pendingTaskCount > 0) return true;
  if (!customer.nextFollowUpAt) return false;
  return new Date(customer.nextFollowUpAt).getTime() <= Date.now() + 7 * 24 * 60 * 60 * 1000;
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
