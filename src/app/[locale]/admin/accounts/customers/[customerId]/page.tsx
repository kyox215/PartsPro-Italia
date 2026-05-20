import { notFound, redirect } from "next/navigation";
import { BadgeCheck, ClipboardList, Link2, MessageSquareText, UserRound } from "lucide-react";
import { AccountManagementTabs } from "@/components/admin/account-management-nav";
import { AdminCsrfField } from "@/components/admin/admin-csrf-field";
import {
  AdminActionRail,
  AdminButtonLink,
  AdminDataTable,
  AdminInput,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTextarea,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { getAdminCustomerDetail } from "@/lib/admin-customers";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

const crmStatuses = ["lead", "pending", "active", "paused", "rejected", "archived"];
const accountStatuses = ["active", "suspended", "archived"];
const priceGroups = ["retail", "b2b_pending", "b2b_basic", "b2b_silver", "b2b_gold", "distributor"];

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
  const crmDefault = crmStatuses.includes(customer.crmStatus) ? customer.crmStatus : "active";

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Account detail" : "账号详情"}
        title={customer.companyName}
        description={
          locale === "it"
            ? "Permessi cliente, price group, azienda, ordini, RMA, note e task."
            : "集中维护客户权限、价格组、公司资料、订单、RMA、备注和跟进任务。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin/accounts/customers")} variant="secondary">
              {locale === "it" ? "Clienti" : "客户列表"}
            </AdminButtonLink>
            <AdminButtonLink href={localizePath(locale, "/admin/accounts/b2b")} variant="secondary">
              {locale === "it" ? "B2B review" : "B2B 审核"}
            </AdminButtonLink>
          </>
        }
      />

      <AccountManagementTabs auth={auth} locale={locale} active="customers" />
      <Feedback query={query} locale={locale} />

      <AdminWorkspaceGrid
        rail={
          <AdminActionRail
            title={locale === "it" ? "Account actions" : "账号操作"}
            description={locale === "it" ? "Accesso, prezzo e CRM" : "权限、价格组与跟进"}
          >
            <AdminPanel title={locale === "it" ? "Accesso cliente" : "客户权限"}>
              <form action="/api/admin/accounts/customers/access" method="post" className="grid gap-2">
                <AdminCsrfField />
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="returnTo" value={customerPath} />
                <input type="hidden" name="id" value={customer.id} />
                <input type="hidden" name="source" value={customer.source === "company" ? "company" : "profile"} />
                <AdminSelect name="priceGroup" label={locale === "it" ? "Price group" : "价格组"} defaultValue={customer.priceGroup}>
                  {priceGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect name="accountStatus" label={locale === "it" ? "Account" : "账号状态"} defaultValue={customer.accountStatus}>
                  {accountStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect name="crmStatus" label="CRM" defaultValue={crmDefault}>
                  {crmStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </AdminSelect>
                <AdminInput name="nextFollowUpAt" label={locale === "it" ? "Follow-up" : "下次跟进"} type="date" defaultValue={dateValue(customer.nextFollowUpAt)} required={false} />
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
                  <AdminInput name="vatNumber" label="VAT / P.IVA" defaultValue={customer.vatNumber ?? ""} required={false} />
                  <AdminInput name="contactEmail" label="Email" defaultValue={customer.email ?? ""} required={false} />
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

                <AdminPanel title={locale === "it" ? "Task follow-up" : "跟进任务"}>
                  <form action="/api/admin/customers/tasks" method="post" className="grid gap-2">
                    <AdminCsrfField />
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="returnTo" value={customerPath} />
                    <input type="hidden" name="companyId" value={customer.companyId} />
                    <AdminInput name="title" label={locale === "it" ? "Task" : "任务"} defaultValue="" />
                    <AdminInput name="dueAt" label={locale === "it" ? "Scadenza" : "截止日期"} type="date" required={false} />
                    <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
                      {locale === "it" ? "Crea task" : "创建任务"}
                    </button>
                  </form>
                </AdminPanel>
              </>
            ) : null}
          </AdminActionRail>
        }
      >
        <AdminPanel title={locale === "it" ? "Profilo account" : "账号资料"} toolbar={<UserRound className="h-4 w-4 text-stone-500" />}>
          <div className="grid gap-2 md:grid-cols-2">
            <InfoRow label="Email" value={customer.email ?? "-"} />
            <InfoRow label="Profile" value={customer.profileId ?? "-"} />
            <InfoRow label="Role" value={customer.profileRole ?? customer.priceGroup} />
            <InfoRow label="Account" value={customer.accountStatus} />
            <InfoRow label="VAT" value={customer.vatNumber ?? "-"} />
            <InfoRow label="Contact" value={customer.contactName ?? "-"} />
            <InfoRow label="Phone" value={customer.phone ?? "-"} />
            <InfoRow label="WhatsApp" value={customer.whatsapp ?? "-"} />
            <InfoRow label="Billing" value={customer.billingAddress ?? "-"} />
            <InfoRow label="Shipping" value={customer.shippingAddress ?? "-"} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            <StatusPill status={customer.source} tone="blue" />
            <StatusPill status={customer.accountStatus} />
            <StatusPill status={customer.crmStatus} />
            <StatusPill status={customer.priceGroup} tone={customer.priceGroup === "retail" ? "slate" : "green"} />
            {customer.tags.map((tag) => (
              <StatusPill key={tag} status={tag} tone="violet" />
            ))}
          </div>
          {!customer.companyId ? (
            <AdminNotice tone="warning" title={locale === "it" ? "Azienda mancante" : "缺少公司档案"}>
              {locale === "it"
                ? "Questo account e registrato ma non ha ancora una scheda azienda collegata."
                : "该客户已注册，但还没有关联公司档案；可在右侧创建/关联公司。"}
            </AdminNotice>
          ) : null}
        </AdminPanel>

        <AdminPanel title={locale === "it" ? "Note e task" : "备注与任务"} toolbar={<MessageSquareText className="h-4 w-4 text-stone-500" />}>
          {customer.companyId ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="grid gap-2">
                {customer.notes.length ? customer.notes.map((note) => (
                  <article key={note.id} className="rounded-lg bg-stone-50 p-3">
                    <p className="whitespace-pre-wrap text-sm font-semibold leading-5 text-stone-700">{note.body}</p>
                    <p className="mt-2 text-xs text-stone-400">{new Date(note.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}</p>
                  </article>
                )) : <p className="text-sm font-semibold text-stone-500">{locale === "it" ? "Nessuna nota." : "暂无备注。"}</p>}
              </div>
              <div className="grid gap-2">
                {customer.tasks.length ? customer.tasks.map((task) => (
                  <article key={task.id} className="rounded-lg bg-stone-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-black text-stone-950">{task.title}</p>
                      <StatusPill status={task.status} tone={task.status === "completed" ? "green" : "amber"} />
                    </div>
                    <p className="mt-1 text-xs text-stone-500">{task.dueAt ? new Date(task.dueAt).toLocaleDateString(locale === "it" ? "it-IT" : "zh-CN") : "-"}</p>
                  </article>
                )) : <p className="text-sm font-semibold text-stone-500">{locale === "it" ? "Nessun task." : "暂无任务。"}</p>}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-stone-50 p-3 text-sm font-semibold text-stone-600">
              <Link2 className="h-4 w-4" />
              {locale === "it" ? "Collega prima una scheda azienda per usare note e task CRM." : "先关联公司档案后，可使用备注和跟进任务。"}
            </div>
          )}
        </AdminPanel>

        <AdminPanel title={locale === "it" ? "Ordini" : "订单历史"} toolbar={<ClipboardList className="h-4 w-4 text-stone-500" />}>
          <AdminDataTable minWidth={760}>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-stone-400">
                <tr className="border-b border-black/5">
                  <th className="px-2.5 py-2">Order</th>
                  <th className="px-2.5 py-2">Status</th>
                  <th className="px-2.5 py-2">Payment</th>
                  <th className="px-2.5 py-2">Total</th>
                  <th className="px-2.5 py-2">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {customer.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50">
                    <td className="px-2.5 py-2.5 font-mono text-xs font-black">{order.id}</td>
                    <td className="px-2.5 py-2.5"><StatusPill status={order.status} /></td>
                    <td className="px-2.5 py-2.5"><StatusPill status={order.paymentStatus ?? "-"} /></td>
                    <td className="px-2.5 py-2.5 font-black">{formatMoney(order.total, locale)}</td>
                    <td className="px-2.5 py-2.5">
                      <AdminButtonLink href={localizePath(locale, `/admin/orders/${order.id}`)} variant="secondary">
                        {locale === "it" ? "Apri" : "查看"}
                      </AdminButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminDataTable>
        </AdminPanel>

        <AdminPanel title="RMA" toolbar={<BadgeCheck className="h-4 w-4 text-stone-500" />}>
          {customer.rmas.length ? (
            <div className="grid gap-2">
              {customer.rmas.map((rma) => (
                <article key={rma.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-stone-50 p-3">
                  <div>
                    <p className="font-mono text-xs font-black text-stone-900">{rma.rmaNumber ?? rma.id}</p>
                    <p className="mt-1 text-sm font-semibold text-stone-600">{rma.sku} x {rma.quantity}</p>
                  </div>
                  <StatusPill status={rma.status} />
                </article>
              ))}
            </div>
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
    <div className="rounded-lg bg-stone-50 p-3">
      <p className="text-[11px] font-black uppercase text-stone-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-stone-900">{value}</p>
    </div>
  );
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
