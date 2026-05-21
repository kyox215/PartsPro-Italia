import { notFound, redirect } from "next/navigation";
import {
  Building2,
  Clock3,
  ClipboardList,
  History,
  MessageSquareText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AccountManagementTabs } from "@/components/admin/account-management-nav";
import { AdminCsrfField } from "@/components/admin/admin-csrf-field";
import {
  AdminButtonLink,
  AdminInput,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminRecordList,
  AdminSelect,
  AdminTextarea,
  StatusPill,
} from "@/components/admin/admin-ui";
import {
  accountStatusOptions,
  crmStatusOptions,
  customerTypeOptions,
  formatAdminStatus,
  formatAuditDataSummary,
  formatCustomerType,
  normalizeCustomerType,
} from "@/lib/admin-display";
import { getCustomerAuditEvents, type CustomerAuditEventRow } from "@/lib/admin-accounts";
import { getAdminCustomerDetail, type AdminCustomerDetail } from "@/lib/admin-customers";
import { hasAdminPermission, staffRoleLabels, staffRoleOptions } from "@/lib/admin-permissions";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { displayOrderNumber, orderRouteId } from "@/lib/order-number";
import { formatMoney } from "@/lib/pricing";

export default async function AdminAccountCustomerDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string; customerId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale: rawLocale, customerId: rawCustomerId } = await params;
  const query = (await searchParams) ?? {};
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const auth = await getAuthContext();
  if (auth.configured && !hasAdminPermission(auth, "accounts:read")) {
    redirect(localizePath(locale, "/admin/accounts?error=permission-denied"));
  }

  const customerId = decodeURIComponent(rawCustomerId);
  const customer =
    !auth.configured || hasAdminPermission(auth, "accounts:read")
      ? await getAdminCustomerDetail(customerId)
      : null;

  if (!customer) notFound();

  const auditEvents = auth.configured ? await getCustomerAuditEvents(120) : [];
  const customerPath = localizePath(locale, `/admin/accounts/customers/${customer.id}`);
  const source = formatAdminStatus("customerSource", customer.source, locale);
  const account = formatAdminStatus("account", customer.accountStatus, locale);
  const crm = formatAdminStatus("crm", customer.crmStatus, locale);
  const customerType = normalizeCustomerType(customer.priceGroup);
  const priceGroup = formatCustomerType(customer.priceGroup, locale);
  const staffRole =
    customer.staffRole && customer.staffStatus === "active"
      ? formatAdminStatus("staffRole", customer.staffRole, locale)
      : null;
  const role = customer.profileRole
    ? customer.profileRole === "admin"
      ? formatAdminStatus("staffRole", "admin", locale)
      : formatCustomerType(customer.profileRole, locale)
    : null;
  const canManageStaff = !auth.configured || hasAdminPermission(auth, "staff:manage");
  const timeline = buildTimeline(customer, auditEvents, locale);

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Dettaglio account" : "账号详情"}
        title={customer.companyName}
        description={
          locale === "it"
            ? "Scheda unica per cliente, azienda, permessi, note, ordini e timeline."
            : "客户、公司、权限、备注、订单和操作时间线集中在一个页面维护。"
        }
        actions={
          <AdminButtonLink href={localizePath(locale, "/admin/accounts/customers")} variant="secondary">
            {locale === "it" ? "Lista clienti" : "客户列表"}
          </AdminButtonLink>
        }
      />

      <AccountManagementTabs auth={auth} locale={locale} active="customers" />
      <Feedback query={query} locale={locale} />

      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard icon={UserRound} label={locale === "it" ? "Fonte" : "来源"} value={<StatusPill status={source.label} tone={source.tone} />} tone={source.tone} />
        <AdminMetricCard icon={ShieldCheck} label={locale === "it" ? "Accesso" : "账号状态"} value={<StatusPill status={account.label} tone={account.tone} />} tone={account.tone} />
        <AdminMetricCard icon={Building2} label={locale === "it" ? "Tipo cliente" : "客户类型"} value={<StatusPill status={priceGroup.label} tone={priceGroup.tone} />} tone={priceGroup.tone} />
        <AdminMetricCard icon={Clock3} label={locale === "it" ? "Ruolo staff" : "员工角色"} value={staffRole ? <StatusPill status={staffRole.label} tone={staffRole.tone} /> : locale === "it" ? "Nessuno" : "无后台权限"} tone={staffRole?.tone ?? "slate"} />
      </section>

      <AdminPanel title={locale === "it" ? "Identita e permessi" : "身份与权限"} toolbar={<StatusPill status={crm.label} tone={crm.tone} />}>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <InfoRow label={locale === "it" ? "Email" : "邮箱"} value={customer.email ?? "-"} />
          <InfoRow label={locale === "it" ? "Profilo" : "用户账号 ID"} value={customer.profileId ?? "-"} />
          <InfoRow label={locale === "it" ? "Ruolo sito" : "站内角色"} value={role?.label ?? "-"} />
          <InfoRow label={locale === "it" ? "Prossimo follow-up" : "下次跟进"} value={customer.nextFollowUpAt ? formatDate(customer.nextFollowUpAt, locale) : "-"} />
        </div>
        <details className="mt-3 rounded-lg border border-black/10 bg-stone-50 p-3">
          <summary className="cursor-pointer text-sm font-black text-stone-950">
            {locale === "it" ? "Modifica identita e permessi" : "编辑身份与权限"}
          </summary>
          <form action="/api/admin/accounts/customers/access" method="post" className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <AdminCsrfField />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="returnTo" value={customerPath} />
            <input type="hidden" name="id" value={customer.id} />
            <input type="hidden" name="source" value={customer.source === "company" ? "company" : "profile"} />
            <AdminSelect name="customerType" label={locale === "it" ? "Tipo cliente" : "客户类型"} defaultValue={customerType}>
              {customerTypeOptions.map((group) => {
                const option = formatCustomerType(group, locale);
                return <option key={group} value={group}>{option.label}</option>;
              })}
            </AdminSelect>
            <AdminSelect name="accountStatus" label={locale === "it" ? "Stato account" : "账号状态"} defaultValue={customer.accountStatus}>
              {accountStatusOptions.map((status) => {
                const option = formatAdminStatus("account", status, locale);
                return <option key={status} value={status}>{option.label}</option>;
              })}
            </AdminSelect>
            <AdminSelect name="crmStatus" label="CRM" defaultValue={customer.crmStatus}>
              {getSelectOptions(crmStatusOptions, customer.crmStatus).map((status) => {
                const option = formatAdminStatus("crm", status, locale);
                return <option key={status} value={status}>{option.label}</option>;
              })}
            </AdminSelect>
            <AdminInput name="nextFollowUpAt" label={locale === "it" ? "Prossimo follow-up" : "下次跟进"} type="date" defaultValue={dateValue(customer.nextFollowUpAt)} required={false} />
            {canManageStaff && customer.profileId ? (
              <>
                <AdminSelect name="staffRole" label={locale === "it" ? "Ruolo staff" : "员工角色"} defaultValue={customer.staffRole && customer.staffStatus !== "archived" ? customer.staffRole : "none"}>
                  <option value="none">{locale === "it" ? "Nessun accesso admin" : "无后台权限"}</option>
                  {staffRoleOptions.map((roleOption) => (
                    <option key={roleOption} value={roleOption}>{staffRoleLabels[roleOption][locale]}</option>
                  ))}
                </AdminSelect>
                <AdminSelect name="staffStatus" label={locale === "it" ? "Stato staff" : "员工状态"} defaultValue={customer.staffStatus ?? "active"}>
                  <option value="active">{formatAdminStatus("account", "active", locale).label}</option>
                  <option value="suspended">{formatAdminStatus("account", "suspended", locale).label}</option>
                  <option value="archived">{formatAdminStatus("account", "archived", locale).label}</option>
                </AdminSelect>
              </>
            ) : null}
            {canManageStaff && !customer.profileId ? (
              <AdminNotice tone="warning">
                {locale === "it"
                  ? "Lo staff admin richiede un account registrato."
                  : "分配后台员工权限前，该邮箱需要先注册/登录过站点账号。"}
              </AdminNotice>
            ) : null}
            <div className="md:col-span-2 xl:col-span-4">
              <button className="h-9 rounded-lg bg-stone-950 px-4 text-xs font-black text-white" type="submit">
                {locale === "it" ? "Salva identita" : "保存身份权限"}
              </button>
            </div>
          </form>
        </details>
      </AdminPanel>

      <AdminPanel title={locale === "it" ? "Azienda e consegna" : "公司与收货资料"} toolbar={<Building2 className="h-4 w-4 text-stone-500" />}>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          <InfoRow label={locale === "it" ? "Azienda" : "公司名称"} value={customer.companyName} />
          <InfoRow label="P.IVA / VAT" value={customer.vatNumber ?? "-"} />
          <InfoRow label={locale === "it" ? "Contatto" : "联系人"} value={customer.contactName ?? "-"} />
          <InfoRow label={locale === "it" ? "Telefono" : "电话"} value={customer.phone ?? "-"} />
          <InfoRow label="WhatsApp" value={customer.whatsapp ?? "-"} />
          <InfoRow label={locale === "it" ? "Email contatto" : "联系邮箱"} value={customer.email ?? "-"} />
          <InfoRow label={locale === "it" ? "Fatturazione" : "账单地址"} value={customer.billingAddress ?? "-"} />
          <InfoRow label={locale === "it" ? "Spedizione" : "收货地址"} value={customer.shippingAddress ?? "-"} />
          <InfoRow label={locale === "it" ? "Categorie" : "关注品类"} value={customer.interestedCategories ?? "-"} />
        </div>
        {customer.profileId ? (
          <details className="mt-3 rounded-lg border border-black/10 bg-stone-50 p-3">
            <summary className="cursor-pointer text-sm font-black text-stone-950">
              {customer.companyId
                ? locale === "it" ? "Modifica dati azienda base" : "编辑基础公司资料"
                : locale === "it" ? "Crea scheda azienda" : "创建/关联公司档案"}
            </summary>
            <form action="/api/admin/accounts/customers/link-company" method="post" className="mt-3 grid gap-2 md:grid-cols-3">
              <AdminCsrfField />
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="returnTo" value={customerPath} />
              <input type="hidden" name="profileId" value={customer.profileId} />
              <AdminInput name="companyName" label={locale === "it" ? "Azienda" : "公司名称"} defaultValue={customer.companyName} />
              <AdminInput name="vatNumber" label="P.IVA / VAT" defaultValue={customer.vatNumber ?? ""} required={false} />
              <AdminInput name="contactEmail" label={locale === "it" ? "Email contatto" : "联系邮箱"} defaultValue={customer.email ?? ""} required={false} />
              <div className="md:col-span-3">
                <button className="h-9 rounded-lg bg-stone-950 px-4 text-xs font-black text-white" type="submit">
                  {locale === "it" ? "Salva azienda" : "保存公司资料"}
                </button>
              </div>
            </form>
          </details>
        ) : (
          <AdminNotice tone="warning">
            {locale === "it"
              ? "Questo record non ha un profilo registrato, quindi non puo ricevere accesso staff."
              : "该记录没有注册账号 ID，因此不能分配员工权限。"}
          </AdminNotice>
        )}
      </AdminPanel>

      <AdminPanel title={locale === "it" ? "Note e attivita" : "备注与任务"} toolbar={<MessageSquareText className="h-4 w-4 text-stone-500" />}>
        {customer.companyId ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <section className="rounded-lg border border-black/5 bg-stone-50 p-3">
              <details>
                <summary className="cursor-pointer text-sm font-black text-stone-950">{locale === "it" ? "Aggiungi nota" : "新增备注"}</summary>
                <form action="/api/admin/customers/notes" method="post" className="mt-3 grid gap-2">
                  <AdminCsrfField />
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="returnTo" value={customerPath} />
                  <input type="hidden" name="companyId" value={customer.companyId} />
                  <AdminTextarea name="body" label={locale === "it" ? "Nota" : "备注"} />
                  <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
                    {locale === "it" ? "Aggiungi" : "添加"}
                  </button>
                </form>
              </details>
              <AdminRecordList className="mt-3">
                {customer.notes.length ? customer.notes.map((note) => (
                  <article key={note.id} className="rounded-lg bg-white p-3">
                    <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-5 text-stone-700">{note.body}</p>
                    <p className="mt-2 text-xs text-stone-400">{formatDateTime(note.createdAt, locale)}</p>
                  </article>
                )) : <p className="text-sm font-semibold text-stone-500">{locale === "it" ? "Nessuna nota." : "暂无备注。"}</p>}
              </AdminRecordList>
            </section>
            <section className="rounded-lg border border-black/5 bg-stone-50 p-3">
              <details>
                <summary className="cursor-pointer text-sm font-black text-stone-950">{locale === "it" ? "Crea attivita" : "创建任务"}</summary>
                <form action="/api/admin/customers/tasks" method="post" className="mt-3 grid gap-2">
                  <AdminCsrfField />
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="returnTo" value={customerPath} />
                  <input type="hidden" name="companyId" value={customer.companyId} />
                  <AdminInput name="title" label={locale === "it" ? "Attivita" : "任务"} defaultValue="" />
                  <AdminInput name="dueAt" label={locale === "it" ? "Scadenza" : "截止日期"} type="date" required={false} />
                  <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
                    {locale === "it" ? "Crea attivita" : "创建任务"}
                  </button>
                </form>
              </details>
              <AdminRecordList className="mt-3">
                {customer.tasks.length ? customer.tasks.map((task) => {
                  const taskStatus = formatAdminStatus("task", task.status, locale);
                  return (
                    <article key={task.id} className="rounded-lg bg-white p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="min-w-0 break-words text-sm font-black text-stone-950">{task.title}</p>
                        <StatusPill status={taskStatus.label} tone={taskStatus.tone} />
                      </div>
                      <p className="mt-1 text-xs text-stone-500">{task.dueAt ? formatDate(task.dueAt, locale) : "-"}</p>
                      {task.status !== "completed" ? (
                        <form action="/api/admin/customers/tasks" method="post" className="mt-2">
                          <AdminCsrfField />
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="returnTo" value={customerPath} />
                          <input type="hidden" name="companyId" value={customer.companyId ?? ""} />
                          <input type="hidden" name="id" value={task.id} />
                          <input type="hidden" name="status" value="completed" />
                          <button className="h-8 rounded-lg border border-black/10 bg-white px-3 text-xs font-black text-stone-700" type="submit">
                            {locale === "it" ? "Completa" : "标记完成"}
                          </button>
                        </form>
                      ) : null}
                    </article>
                  );
                }) : <p className="text-sm font-semibold text-stone-500">{locale === "it" ? "Nessuna attivita." : "暂无任务。"}</p>}
              </AdminRecordList>
            </section>
          </div>
        ) : (
          <AdminNotice tone="warning">
            {locale === "it" ? "Collega prima una scheda azienda per usare note e attivita CRM." : "先关联公司档案后，可使用备注和跟进任务。"}
          </AdminNotice>
        )}
      </AdminPanel>

      <AdminPanel title={locale === "it" ? "Storico ordini" : "订单历史"} toolbar={<ClipboardList className="h-4 w-4 text-stone-500" />}>
        {customer.orders.length ? (
          <AdminRecordList>
            {customer.orders.map((order) => {
              const orderStatus = formatAdminStatus("order", order.status, locale);
              const paymentStatus = formatAdminStatus("payment", order.paymentStatus ?? "-", locale);
              return (
                <article key={order.id} className="grid gap-2 rounded-lg bg-stone-50 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <p className="break-words font-mono text-xs font-black text-stone-900">{displayOrderNumber(order)}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <StatusPill status={orderStatus.label} tone={orderStatus.tone} />
                      <StatusPill status={paymentStatus.label} tone={paymentStatus.tone} />
                      <StatusPill status={formatMoney(order.total, locale)} tone="slate" />
                    </div>
                  </div>
                  <AdminButtonLink href={localizePath(locale, `/admin/orders/${orderRouteId(order)}`)} variant="secondary">
                    {locale === "it" ? "Apri" : "查看"}
                  </AdminButtonLink>
                </article>
              );
            })}
          </AdminRecordList>
        ) : (
          <p className="text-sm font-semibold text-stone-500">{locale === "it" ? "Nessun ordine." : "暂无订单。"}</p>
        )}
      </AdminPanel>

      <AdminPanel title={locale === "it" ? "Timeline operativa" : "操作时间线"} toolbar={<History className="h-4 w-4 text-stone-500" />}>
        {timeline.length ? (
          <div className="grid gap-2">
            {timeline.map((event) => (
              <article key={event.id} className="rounded-lg border border-black/5 bg-stone-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-black text-stone-950">{event.title}</p>
                  <span className="text-xs font-semibold text-stone-500">{formatDateTime(event.createdAt, locale)}</span>
                </div>
                <p className="mt-1 break-words text-sm font-semibold leading-5 text-stone-600">{event.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold text-stone-500">{locale === "it" ? "Nessun evento registrato." : "暂无操作记录。"}</p>
        )}
      </AdminPanel>
    </div>
  );
}

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="min-w-0 rounded-lg bg-stone-50 p-3">
      <p className="text-[11px] font-black uppercase text-stone-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-stone-900">{value}</p>
    </div>
  );
}

function buildTimeline(
  customer: AdminCustomerDetail,
  auditEvents: CustomerAuditEventRow[],
  locale: Locale,
) {
  const matchedAuditEvents = auditEvents.filter((event) => {
    if (customer.companyId && event.companyId === customer.companyId) return true;
    if (customer.profileId && event.customerProfileId === customer.profileId) return true;
    return false;
  });
  return [
    ...matchedAuditEvents.map((event) => {
      const action = formatAdminStatus("auditAction", event.action, locale);
      return {
        id: `audit-${event.id}`,
        title: action.label,
        body: formatAuditDataSummary(event.afterData, locale),
        createdAt: event.createdAt,
      };
    }),
    ...customer.notes.map((note) => ({
      id: `note-${note.id}`,
      title: locale === "it" ? "Nota cliente" : "客户备注",
      body: note.body,
      createdAt: note.createdAt,
    })),
    ...customer.tasks.map((task) => ({
      id: `task-${task.id}`,
      title: locale === "it" ? "Attivita CRM" : "跟进任务",
      body: `${task.title} / ${formatAdminStatus("task", task.status, locale).label}`,
      createdAt: task.createdAt,
    })),
    ...customer.orders.map((order) => ({
      id: `order-${order.id}`,
      title: locale === "it" ? "Ordine creato" : "订单创建",
      body: `${displayOrderNumber(order)} / ${formatMoney(order.total, locale)}`,
      createdAt: order.createdAt,
    })),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function getSelectOptions<T extends readonly string[]>(options: T, currentValue: string) {
  return options.includes(currentValue as T[number])
    ? [...options]
    : [currentValue, ...options];
}

function Feedback({
  query,
  locale,
}: Readonly<{ query: Record<string, string | string[] | undefined>; locale: Locale }>) {
  const error = valueOf(query.error);
  if (error) return <AdminNotice tone="danger">{decodeURIComponent(error)}</AdminNotice>;
  const saved = valueOf(query.saved);
  if (!saved) return null;
  return (
    <AdminNotice tone="success">
      {locale === "it" ? "Account aggiornato." : "账号信息已更新。"}
    </AdminNotice>
  );
}

function dateValue(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function formatDate(value: string, locale: Locale) {
  return new Date(value).toLocaleDateString(locale === "it" ? "it-IT" : "zh-CN");
}

function formatDateTime(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale === "it" ? "it-IT" : "zh-CN");
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
