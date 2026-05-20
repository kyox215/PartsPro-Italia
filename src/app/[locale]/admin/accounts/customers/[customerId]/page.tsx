import { notFound, redirect } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  Clock3,
  ClipboardList,
  Link2,
  MessageSquareText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AccountManagementTabs } from "@/components/admin/account-management-nav";
import { AdminCsrfField } from "@/components/admin/admin-csrf-field";
import {
  AdminActionRail,
  AdminButtonLink,
  AdminInput,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminRecordList,
  AdminSelect,
  AdminTextarea,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import {
  accountStatusOptions,
  crmStatusOptions,
  customerPriceGroupOptions,
  formatAdminStatus,
} from "@/lib/admin-display";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { getAdminCustomerDetail, type AdminCustomerDetail } from "@/lib/admin-customers";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
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

  const customerPath = localizePath(locale, `/admin/accounts/customers/${customer.id}`);
  const source = formatAdminStatus("customerSource", customer.source, locale);
  const account = formatAdminStatus("account", customer.accountStatus, locale);
  const crm = formatAdminStatus("crm", customer.crmStatus, locale);
  const priceGroup = formatAdminStatus("priceGroup", customer.priceGroup, locale);
  const role = customer.profileRole
    ? formatAdminStatus("staffRole", customer.profileRole, locale)
    : null;
  const crmOptions = getSelectOptions(crmStatusOptions, customer.crmStatus);

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Dettaglio account" : "账号详情"}
        title={customer.companyName}
        description={
          locale === "it"
            ? "Accesso, gruppo prezzi, azienda, ordini, RMA, note e follow-up."
            : "集中维护客户权限、价格组、公司资料、订单、RMA、备注和跟进任务。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin/accounts/customers")} variant="secondary">
              {locale === "it" ? "Lista clienti" : "客户列表"}
            </AdminButtonLink>
            <AdminButtonLink href={localizePath(locale, "/admin/accounts/b2b")} variant="secondary">
              {locale === "it" ? "Revisioni B2B" : "B2B 审核"}
            </AdminButtonLink>
          </>
        }
      />

      <AccountManagementTabs auth={auth} locale={locale} active="customers" />
      <Feedback query={query} locale={locale} />

      <AdminWorkspaceGrid
        rail={
          <AdminActionRail
            title={locale === "it" ? "Azioni account" : "账号操作"}
            description={locale === "it" ? "Accesso, prezzo e CRM" : "权限、价格组与跟进"}
          >
            <AdminPanel title={locale === "it" ? "Accesso cliente" : "客户权限"}>
              <form action="/api/admin/accounts/customers/access" method="post" className="grid gap-2">
                <AdminCsrfField />
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="returnTo" value={customerPath} />
                <input type="hidden" name="id" value={customer.id} />
                <input type="hidden" name="source" value={customer.source === "company" ? "company" : "profile"} />
                <AdminSelect name="priceGroup" label={locale === "it" ? "Gruppo prezzi" : "价格组"} defaultValue={customer.priceGroup}>
                  {customerPriceGroupOptions.map((group) => {
                    const option = formatAdminStatus("priceGroup", group, locale);
                    return (
                      <option key={group} value={group}>
                        {option.label}
                      </option>
                    );
                  })}
                </AdminSelect>
                <AdminSelect name="accountStatus" label={locale === "it" ? "Stato account" : "账号状态"} defaultValue={customer.accountStatus}>
                  {accountStatusOptions.map((status) => {
                    const option = formatAdminStatus("account", status, locale);
                    return (
                      <option key={status} value={status}>
                        {option.label}
                      </option>
                    );
                  })}
                </AdminSelect>
                <AdminSelect name="crmStatus" label="CRM" defaultValue={customer.crmStatus}>
                  {crmOptions.map((status) => {
                    const option = formatAdminStatus("crm", status, locale);
                    return (
                      <option key={status} value={status}>
                        {option.label}
                      </option>
                    );
                  })}
                </AdminSelect>
                <AdminInput name="nextFollowUpAt" label={locale === "it" ? "Prossimo follow-up" : "下次跟进"} type="date" defaultValue={dateValue(customer.nextFollowUpAt)} required={false} />
                <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
                  {locale === "it" ? "Salva accesso" : "保存权限"}
                </button>
              </form>
            </AdminPanel>

            {!customer.companyId && customer.profileId ? (
              <AdminPanel title={locale === "it" ? "Collega azienda" : "关联公司"}>
                <form action="/api/admin/accounts/customers/link-company" method="post" className="grid gap-2">
                  <AdminCsrfField />
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="returnTo" value={customerPath} />
                  <input type="hidden" name="profileId" value={customer.profileId} />
                  <AdminInput name="companyName" label={locale === "it" ? "Azienda" : "公司名称"} defaultValue={customer.companyName} />
                  <AdminInput name="vatNumber" label="P.IVA / VAT" defaultValue={customer.vatNumber ?? ""} required={false} />
                  <AdminInput name="contactEmail" label={locale === "it" ? "Email contatto" : "联系邮箱"} defaultValue={customer.email ?? ""} required={false} />
                  <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
                    {locale === "it" ? "Crea azienda" : "创建/关联公司"}
                  </button>
                </form>
              </AdminPanel>
            ) : null}

            {customer.companyId ? (
              <>
                <AdminPanel title={locale === "it" ? "Nuova nota" : "新增备注"}>
                  <form action="/api/admin/customers/notes" method="post" className="grid gap-2">
                    <AdminCsrfField />
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="returnTo" value={customerPath} />
                    <input type="hidden" name="companyId" value={customer.companyId} />
                    <AdminTextarea name="body" label={locale === "it" ? "Nota" : "备注"} />
                    <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
                      {locale === "it" ? "Aggiungi" : "添加"}
                    </button>
                  </form>
                </AdminPanel>

                <AdminPanel title={locale === "it" ? "Attivita follow-up" : "跟进任务"}>
                  <form action="/api/admin/customers/tasks" method="post" className="grid gap-2">
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
                </AdminPanel>
              </>
            ) : null}
          </AdminActionRail>
        }
      >
        <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard icon={UserRound} label={locale === "it" ? "Fonte" : "来源"} value={<StatusPill status={source.label} tone={source.tone} />} tone={source.tone} />
          <AdminMetricCard icon={ShieldCheck} label={locale === "it" ? "Accesso" : "账号状态"} value={<StatusPill status={account.label} tone={account.tone} />} tone={account.tone} />
          <AdminMetricCard icon={Building2} label={locale === "it" ? "Gruppo prezzi" : "价格组"} value={<StatusPill status={priceGroup.label} tone={priceGroup.tone} />} tone={priceGroup.tone} />
          <AdminMetricCard icon={Clock3} label={locale === "it" ? "Follow-up" : "跟进"} value={formatFollowUp(customer, locale)} tone={customer.pendingTaskCount ? "amber" : "slate"} />
        </section>

        <AdminPanel title={locale === "it" ? "Salute account" : "账号健康"} toolbar={<StatusPill status={crm.label} tone={crm.tone} />}>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {getHealthItems(customer, locale).map((item) => (
              <div key={item.label} className="rounded-lg bg-stone-50 p-3">
                <p className="text-[11px] font-black uppercase text-stone-400">{item.label}</p>
                <p className="mt-1 break-words text-sm font-black text-stone-950">{item.value}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-stone-500">{item.description}</p>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title={locale === "it" ? "Profilo e azienda" : "账号与公司资料"} toolbar={<UserRound className="h-4 w-4 text-stone-500" />}>
          <div className="grid gap-2 md:grid-cols-2">
            <InfoRow label={locale === "it" ? "Email" : "邮箱"} value={customer.email ?? "-"} />
            <InfoRow label={locale === "it" ? "Profilo" : "用户账号 ID"} value={customer.profileId ?? "-"} />
            <InfoRow label={locale === "it" ? "Ruolo sito" : "站内角色"} value={role?.label ?? "-"} />
            <InfoRow label={locale === "it" ? "P.IVA" : "税号"} value={customer.vatNumber ?? "-"} />
            <InfoRow label={locale === "it" ? "Contatto" : "联系人"} value={customer.contactName ?? "-"} />
            <InfoRow label={locale === "it" ? "Telefono" : "电话"} value={customer.phone ?? "-"} />
            <InfoRow label="WhatsApp" value={customer.whatsapp ?? "-"} />
            <InfoRow label={locale === "it" ? "Fatturazione" : "账单地址"} value={customer.billingAddress ?? "-"} />
            <InfoRow label={locale === "it" ? "Spedizione" : "收货地址"} value={customer.shippingAddress ?? "-"} />
            <InfoRow label={locale === "it" ? "Categorie" : "关注品类"} value={customer.interestedCategories ?? "-"} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            <StatusPill status={source.label} tone={source.tone} />
            <StatusPill status={account.label} tone={account.tone} />
            <StatusPill status={crm.label} tone={crm.tone} />
            <StatusPill status={priceGroup.label} tone={priceGroup.tone} />
            {customer.tags.map((tag) => (
              <StatusPill key={tag} status={formatCustomerTag(tag, locale)} tone="violet" />
            ))}
          </div>
          {!customer.companyId ? (
            <AdminNotice tone="warning" title={locale === "it" ? "Scheda azienda mancante" : "缺少公司档案"}>
              {locale === "it"
                ? "Questo account e registrato ma non ha ancora una scheda azienda collegata."
                : "该客户已注册，但还没有关联公司档案；可在右侧创建/关联公司。"}
            </AdminNotice>
          ) : null}
        </AdminPanel>

        <AdminPanel title={locale === "it" ? "Note e attivita" : "备注与任务"} toolbar={<MessageSquareText className="h-4 w-4 text-stone-500" />}>
          {customer.companyId ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <AdminRecordList>
                {customer.notes.length ? customer.notes.map((note) => (
                  <article key={note.id} className="rounded-lg bg-stone-50 p-3">
                    <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-5 text-stone-700">{note.body}</p>
                    <p className="mt-2 text-xs text-stone-400">{new Date(note.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}</p>
                  </article>
                )) : <p className="text-sm font-semibold text-stone-500">{locale === "it" ? "Nessuna nota." : "暂无备注。"}</p>}
              </AdminRecordList>
              <AdminRecordList>
                {customer.tasks.length ? customer.tasks.map((task) => {
                  const taskStatus = formatAdminStatus("task", task.status, locale);
                  return (
                    <article key={task.id} className="rounded-lg bg-stone-50 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="min-w-0 break-words text-sm font-black text-stone-950">{task.title}</p>
                        <StatusPill status={taskStatus.label} tone={taskStatus.tone} />
                      </div>
                      <p className="mt-1 text-xs text-stone-500">{task.dueAt ? new Date(task.dueAt).toLocaleDateString(locale === "it" ? "it-IT" : "zh-CN") : "-"}</p>
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
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-stone-50 p-3 text-sm font-semibold text-stone-600">
              <Link2 className="h-4 w-4" />
              {locale === "it" ? "Collega prima una scheda azienda per usare note e attivita CRM." : "先关联公司档案后，可使用备注和跟进任务。"}
            </div>
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
                      <p className="break-words font-mono text-xs font-black text-stone-900">{order.id}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <StatusPill status={orderStatus.label} tone={orderStatus.tone} />
                        <StatusPill status={paymentStatus.label} tone={paymentStatus.tone} />
                        <StatusPill status={formatMoney(order.total, locale)} tone="slate" />
                      </div>
                    </div>
                    <AdminButtonLink href={localizePath(locale, `/admin/orders/${order.id}`)} variant="secondary">
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

        <AdminPanel title="RMA" toolbar={<BadgeCheck className="h-4 w-4 text-stone-500" />}>
          {customer.rmas.length ? (
            <AdminRecordList>
              {customer.rmas.map((rma) => {
                const rmaStatus = formatAdminStatus("rma", rma.status, locale);
                return (
                  <article key={rma.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg bg-stone-50 p-3">
                    <div className="min-w-0">
                      <p className="break-words font-mono text-xs font-black text-stone-900">{rma.rmaNumber ?? rma.id}</p>
                      <p className="mt-1 break-words text-sm font-semibold text-stone-600">{rma.sku} x {rma.quantity}</p>
                    </div>
                    <StatusPill status={rmaStatus.label} tone={rmaStatus.tone} />
                  </article>
                );
              })}
            </AdminRecordList>
          ) : (
            <p className="text-sm font-semibold text-stone-500">{locale === "it" ? "Nessun RMA." : "暂无 RMA。"}</p>
          )}
        </AdminPanel>
      </AdminWorkspaceGrid>
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

function getHealthItems(customer: AdminCustomerDetail, locale: Locale) {
  const requiredCompanyFields = [
    customer.companyName,
    customer.email,
    customer.vatNumber,
    customer.contactName,
    customer.billingAddress,
    customer.shippingAddress,
  ];
  const completedFields = requiredCompanyFields.filter(Boolean).length;
  const nextStep = getNextStep(customer, locale);
  return [
    {
      label: locale === "it" ? "Completezza" : "资料完整度",
      value: `${completedFields}/${requiredCompanyFields.length}`,
      description: locale === "it" ? "Azienda, contatto e indirizzi." : "公司、联系人与地址资料。",
    },
    {
      label: locale === "it" ? "Diritti B2B" : "B2B 权益",
      value: formatAdminStatus("priceGroup", customer.priceGroup, locale).label,
      description: locale === "it" ? "Usato per prezzi e catalogo." : "用于前台价格与目录权限。",
    },
    {
      label: locale === "it" ? "Storico" : "交易记录",
      value: `${customer.orderCount} / ${formatMoney(customer.totalSpent, locale)}`,
      description: locale === "it" ? "Ordini e valore totale." : "订单数与历史成交额。",
    },
    {
      label: locale === "it" ? "Prossimo passo" : "下一步",
      value: nextStep,
      description: locale === "it" ? "Suggerimento operativo." : "系统建议的运营动作。",
    },
  ];
}

function getNextStep(customer: AdminCustomerDetail, locale: Locale) {
  if (!customer.companyId) return locale === "it" ? "Collegare azienda" : "补公司资料";
  if (customer.crmStatus.includes("pending")) return locale === "it" ? "Revisionare B2B" : "审核 B2B";
  if (customer.accountStatus !== "active" || customer.crmStatus === "paused") {
    return locale === "it" ? "Verificare accesso" : "检查权限";
  }
  if (customer.pendingTaskCount > 0) return locale === "it" ? "Gestire attivita" : "处理任务";
  if (customer.rmaCount > 0) return locale === "it" ? "Controllare RMA" : "查看售后";
  return locale === "it" ? "Monitorare" : "持续维护";
}

function formatFollowUp(customer: AdminCustomerDetail, locale: Locale) {
  if (customer.pendingTaskCount) {
    return locale === "it" ? `${customer.pendingTaskCount} attivita` : `${customer.pendingTaskCount} 个任务`;
  }
  if (customer.nextFollowUpAt) {
    return new Date(customer.nextFollowUpAt).toLocaleDateString(locale === "it" ? "it-IT" : "zh-CN");
  }
  return locale === "it" ? "Non pianificato" : "未安排";
}

function formatCustomerTag(value: string, locale: Locale) {
  const normalized = value.toLowerCase();
  if (normalized === "b2b application") {
    return locale === "it" ? "Richiesta B2B" : "B2B 申请";
  }
  if (normalized === "registered") {
    return locale === "it" ? "Registrato" : "已注册";
  }
  return value;
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

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
