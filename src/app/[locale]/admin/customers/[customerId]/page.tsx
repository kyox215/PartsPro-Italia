import { notFound } from "next/navigation";
import { BadgeCheck, ClipboardList, MessageSquareText, UserRound } from "lucide-react";
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
import { getAdminCustomerDetail } from "@/lib/admin-customers";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

const crmStatuses = ["lead", "pending", "active", "paused", "rejected", "archived"];
const priceGroups = ["retail", "b2b_basic", "b2b_silver", "b2b_gold", "distributor"];

export default async function AdminCustomerDetailPage({
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
  const customerId = decodeURIComponent(rawCustomerId);
  const customer = !auth.configured || auth.isAdmin ? await getAdminCustomerDetail(customerId) : null;

  if (!customer) notFound();

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Customer detail" : "客户详情"}
        title={customer.companyName}
        description={
          locale === "it"
            ? "CRM operativo con price group, ordini, RMA, note e task."
            : "客户 CRM 详情，包含价格组、订单、RMA、备注和跟进任务。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin/customers")} variant="secondary">
              {locale === "it" ? "Clienti" : "客户列表"}
            </AdminButtonLink>
            <AdminButtonLink href={localizePath(locale, "/admin/b2b")} variant="secondary">
              {locale === "it" ? "B2B review" : "B2B 审核"}
            </AdminButtonLink>
          </>
        }
      />

      <Feedback query={query} locale={locale} />

      <AdminWorkspaceGrid
        rail={
          <AdminActionRail
            title={locale === "it" ? "CRM actions" : "CRM 操作"}
            description={locale === "it" ? "Stato, prezzo e follow-up" : "状态、价格组与跟进"}
          >
            <AdminPanel title={locale === "it" ? "Stato cliente" : "客户状态"}>
              <form action="/api/admin/customers/status" method="post" className="grid gap-2">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="id" value={customer.id} />
                <AdminSelect name="status" label="CRM" defaultValue={customer.crmStatus}>
                  {crmStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </AdminSelect>
                <AdminInput name="nextFollowUpAt" label={locale === "it" ? "Follow-up" : "下次跟进"} type="date" defaultValue={dateValue(customer.nextFollowUpAt)} required={false} />
                <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
                  {locale === "it" ? "Salva stato" : "保存状态"}
                </button>
              </form>
            </AdminPanel>

            <AdminPanel title={locale === "it" ? "Price group" : "价格组"}>
              <form action="/api/admin/customers/price-group" method="post" className="grid gap-2">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="id" value={customer.id} />
                <AdminSelect name="priceGroup" label="Group" defaultValue={customer.priceGroup}>
                  {priceGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </AdminSelect>
                <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
                  {locale === "it" ? "Aggiorna prezzo" : "更新价格组"}
                </button>
              </form>
            </AdminPanel>

            <AdminPanel title={locale === "it" ? "Nuova nota" : "新增备注"}>
              <form action="/api/admin/customers/notes" method="post" className="grid gap-2">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="companyId" value={customer.id} />
                <AdminTextarea name="body" label={locale === "it" ? "Nota" : "备注"} />
                <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
                  {locale === "it" ? "Aggiungi" : "添加"}
                </button>
              </form>
            </AdminPanel>

            <AdminPanel title={locale === "it" ? "Task follow-up" : "跟进任务"}>
              <form action="/api/admin/customers/tasks" method="post" className="grid gap-2">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="companyId" value={customer.id} />
                <AdminInput name="title" label={locale === "it" ? "Task" : "任务"} defaultValue="" />
                <AdminInput name="dueAt" label={locale === "it" ? "Scadenza" : "截止日期"} type="date" required={false} />
                <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
                  {locale === "it" ? "Crea task" : "创建任务"}
                </button>
              </form>
            </AdminPanel>

            <AdminPanel title={locale === "it" ? "Tag" : "标签"}>
              <form action="/api/admin/customers/tags" method="post" className="grid gap-2">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="companyId" value={customer.id} />
                <AdminInput name="tagName" label="Tag" defaultValue="" />
                <AdminInput name="color" label="Tone" defaultValue="slate" />
                <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
                  {locale === "it" ? "Aggiungi tag" : "添加标签"}
                </button>
              </form>
            </AdminPanel>
          </AdminActionRail>
        }
      >
        <AdminPanel title={locale === "it" ? "Profilo azienda" : "公司档案"} toolbar={<UserRound className="h-4 w-4 text-stone-500" />}>
          <div className="grid gap-2 md:grid-cols-2">
            <InfoRow label="Email" value={customer.email ?? "-"} />
            <InfoRow label="VAT" value={customer.vatNumber ?? "-"} />
            <InfoRow label="Contact" value={customer.contactName ?? "-"} />
            <InfoRow label="Phone" value={customer.phone ?? "-"} />
            <InfoRow label="WhatsApp" value={customer.whatsapp ?? "-"} />
            <InfoRow label="PEC" value={customer.pec ?? "-"} />
            <InfoRow label="Billing" value={customer.billingAddress ?? "-"} />
            <InfoRow label="Shipping" value={customer.shippingAddress ?? "-"} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            <StatusPill status={customer.crmStatus} tone="blue" />
            <StatusPill status={customer.priceGroup} tone={customer.priceGroup === "retail" ? "slate" : "green"} />
            {customer.tags.map((tag) => (
              <StatusPill key={tag} status={tag} tone="violet" />
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title={locale === "it" ? "Note e task" : "备注与任务"} toolbar={<MessageSquareText className="h-4 w-4 text-stone-500" />}>
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
                  {task.status !== "completed" ? (
                    <form action="/api/admin/customers/tasks" method="post" className="mt-2">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="companyId" value={customer.id} />
                      <input type="hidden" name="id" value={task.id} />
                      <input type="hidden" name="status" value="completed" />
                      <button className="h-8 rounded-lg border border-black/10 bg-white px-3 text-xs font-black text-stone-700" type="submit">
                        {locale === "it" ? "Completa" : "标记完成"}
                      </button>
                    </form>
                  ) : null}
                </article>
              )) : <p className="text-sm font-semibold text-stone-500">{locale === "it" ? "Nessun task." : "暂无任务。"}</p>}
            </div>
          </div>
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
                    <p className="font-mono text-xs font-black text-stone-900">{rma.id}</p>
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
  if (!valueOf(query.saved)) return null;
  return (
    <AdminNotice tone="success">
      {locale === "it" ? "Cliente aggiornato." : "客户信息已更新。"}
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
