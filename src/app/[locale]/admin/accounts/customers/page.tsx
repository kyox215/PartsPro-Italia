import { Building2, Clock3, Euro, ShieldAlert, UsersRound, type LucideIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { AccountManagementTabs } from "@/components/admin/account-management-nav";
import {
  AdminActionRail,
  AdminButtonLink,
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminRecordList,
  AdminTabs,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import {
  formatAdminCount,
  formatAdminStatus,
  isApprovedB2BPriceGroup,
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
  const visibleCustomers = filterCustomers(customers, filter);
  const customerCounts = getCustomerFilterCounts(customers);
  const totalSpent = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const filterItems = [
    ["all", locale === "it" ? "Tutti" : "全部"],
    ["registered", locale === "it" ? "Registrati" : "已注册"],
    ["retail", locale === "it" ? "Clienti retail" : "零售客户"],
    ["b2b_pending", locale === "it" ? "B2B in revisione" : "B2B 待审"],
    ["b2b", locale === "it" ? "B2B approvati" : "B2B 已通过"],
    ["suspended", locale === "it" ? "Sospesi/archiviati" : "暂停/归档"],
    ["no_company", locale === "it" ? "Senza azienda" : "无公司资料"],
    ["follow_up", locale === "it" ? "Follow-up" : "待跟进"],
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
            ? "Account registrati, aziende, richieste B2B, ordini, RMA e diritti cliente."
            : "集中显示注册用户、公司资料、B2B 申请、订单、RMA 和客户权限。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin/accounts/b2b")} variant="secondary">
              {locale === "it" ? "Revisioni B2B" : "B2B 审核"}
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
            description={locale === "it" ? "Code operative" : "客户队列"}
          >
            <section className="grid gap-2">
              <SummaryLink
                href={localizePath(locale, "/admin/accounts/customers?filter=registered")}
                icon={UsersRound}
                label={locale === "it" ? "Registrati" : "注册客户"}
                value={customerCounts.registered}
                tone="blue"
              />
              <SummaryLink
                href={localizePath(locale, "/admin/accounts/customers?filter=b2b")}
                icon={Building2}
                label={locale === "it" ? "B2B approvati" : "B2B 已通过"}
                value={customerCounts.b2b}
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
                href={localizePath(locale, "/admin/accounts/customers?filter=follow_up")}
                icon={Clock3}
                label={locale === "it" ? "Da seguire" : "待跟进"}
                value={customerCounts.follow_up}
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
            <AdminRecordList>
              {visibleCustomers.map((customer) => (
                <CustomerRecord
                  key={`${customer.source}-${customer.id}`}
                  customer={customer}
                  locale={locale}
                />
              ))}
            </AdminRecordList>
          ) : (
            <AdminEmptyState
              icon={UsersRound}
              title={locale === "it" ? "Nessun cliente" : "暂无客户"}
              description={
                locale === "it"
                  ? "Gli account, le aziende e le richieste B2B appariranno qui."
                  : "注册用户、公司资料和 B2B 申请都会显示在这里。"
              }
            />
          )}
        </AdminPanel>
      </AdminWorkspaceGrid>
    </div>
  );
}

function CustomerRecord({
  customer,
  locale,
}: Readonly<{ customer: AdminCustomerRow; locale: Locale }>) {
  const source = formatAdminStatus("customerSource", customer.source, locale);
  const account = formatAdminStatus("account", customer.accountStatus, locale);
  const crm = formatAdminStatus("crm", customer.crmStatus, locale);
  const priceGroup = formatAdminStatus("priceGroup", customer.priceGroup, locale);
  const nextAction = getCustomerNextAction(customer, locale);

  return (
    <article className="grid min-w-0 gap-3 rounded-lg border border-black/5 bg-stone-50 p-3 transition hover:border-black/10 hover:bg-white xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,.9fr)_auto] xl:items-center">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <p className="min-w-0 break-words text-sm font-black text-stone-950 sm:text-base">
            {customer.companyName}
          </p>
          <StatusPill status={source.label} tone={source.tone} />
        </div>
        <p className="mt-1 break-words text-xs font-semibold text-stone-500">
          {customer.email ?? customer.vatNumber ?? "-"}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <StatusPill status={account.label} tone={account.tone} />
          <StatusPill status={crm.label} tone={crm.tone} />
          <StatusPill status={priceGroup.label} tone={priceGroup.tone} />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
        <MetricMini label={locale === "it" ? "Ordini" : "订单"} value={String(customer.orderCount)} />
        <MetricMini label={locale === "it" ? "Valore" : "成交额"} value={formatMoney(customer.totalSpent, locale)} />
        <MetricMini label="RMA" value={String(customer.rmaCount)} />
        <MetricMini
          label={locale === "it" ? "Attivita" : "任务"}
          value={String(customer.pendingTaskCount)}
        />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase text-stone-400">
          {locale === "it" ? "Prossimo passo" : "下一步"}
        </p>
        <p className="mt-1 break-words text-sm font-black text-stone-950">{nextAction.label}</p>
        <p className="mt-1 text-xs font-semibold text-stone-500">
          {customer.nextFollowUpAt
            ? new Date(customer.nextFollowUpAt).toLocaleDateString(locale === "it" ? "it-IT" : "zh-CN")
            : locale === "it"
              ? "Nessun follow-up pianificato"
              : "未安排跟进"}
        </p>
      </div>

      <div className="flex xl:justify-end">
        <AdminButtonLink href={nextAction.href} variant="secondary">
          {nextAction.button}
        </AdminButtonLink>
      </div>
    </article>
  );
}

function MetricMini({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="min-w-0 rounded-lg bg-white px-2.5 py-2 ring-1 ring-black/5">
      <p className="truncate text-[11px] font-black uppercase text-stone-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-stone-950">{value}</p>
    </div>
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
  if (customer.source === "application" || customer.crmStatus.includes("b2b_pending")) {
    return {
      label: locale === "it" ? "Revisionare richiesta B2B" : "审核 B2B 申请",
      button: locale === "it" ? "Revisiona" : "审核",
      href: localizePath(locale, "/admin/accounts/b2b?filter=pending"),
    };
  }
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
  if (customer.rmaCount > 0) {
    return {
      label: locale === "it" ? "Controllare storico RMA" : "查看售后记录",
      button: locale === "it" ? "Apri" : "查看",
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
  if (filter === "registered") return customers.filter((customer) => Boolean(customer.profileId));
  if (filter === "retail") return customers.filter((customer) => customer.priceGroup === "retail");
  if (filter === "b2b_pending") return customers.filter(isB2BPending);
  if (filter === "b2b") return customers.filter(isB2BApproved);
  if (filter === "suspended") return customers.filter(isSuspended);
  if (filter === "no_company") return customers.filter((customer) => !customer.companyId && customer.source !== "application");
  if (filter === "follow_up") return customers.filter((customer) => customer.pendingTaskCount > 0 || isFollowUpDue(customer.nextFollowUpAt));
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
    follow_up: 0,
  };

  customers.forEach((customer) => {
    if (customer.profileId) counts.registered += 1;
    if (customer.priceGroup === "retail") counts.retail += 1;
    if (isB2BPending(customer)) counts.b2b_pending += 1;
    if (isB2BApproved(customer)) counts.b2b += 1;
    if (isSuspended(customer)) counts.suspended += 1;
    if (!customer.companyId && customer.source !== "application") counts.no_company += 1;
    if (customer.pendingTaskCount > 0 || isFollowUpDue(customer.nextFollowUpAt)) counts.follow_up += 1;
  });

  return counts;
}

function isB2BPending(customer: AdminCustomerRow) {
  return customer.crmStatus.includes("pending") || customer.priceGroup === "b2b_pending";
}

function isB2BApproved(customer: AdminCustomerRow) {
  return isApprovedB2BPriceGroup(customer.priceGroup) || customer.crmStatus.includes("approved");
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
