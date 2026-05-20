import { ShieldCheck, UserCog, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";
import { AccountManagementTabs } from "@/components/admin/account-management-nav";
import { AdminCsrfField } from "@/components/admin/admin-csrf-field";
import {
  AdminActionRail,
  AdminDataTable,
  AdminInput,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import { getAdminStaffRows, getStaffRoleSummaries } from "@/lib/admin-accounts";
import { hasAdminPermission, staffRoleLabels, type StaffRole } from "@/lib/admin-permissions";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

const staffRoles: StaffRole[] = ["owner", "sales", "catalog", "warehouse", "finance", "support"];
const staffStatuses = ["active", "suspended", "archived"];

export default async function AdminAccountPermissionsPage({
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
  if (auth.configured && !hasAdminPermission(auth, "staff:manage")) {
    redirect(localizePath(locale, "/admin/accounts?error=permission-denied"));
  }
  const staff = await getAdminStaffRows();
  const summaries = getStaffRoleSummaries(locale);
  const activeStaff = staff.filter((member) => member.status === "active");

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Account workspace" : "账号管理"}
        title={locale === "it" ? "Permessi staff" : "权限管理"}
        description={
          locale === "it"
            ? "Ruoli fissi per owner, vendite, catalogo, magazzino, finanza e supporto."
            : "固定员工角色矩阵：老板/总管理员、销售、商品、仓库、财务和客服售后。"
        }
      />

      <AccountManagementTabs auth={auth} locale={locale} active="permissions" counts={{ staff: staff.length }} />
      <Feedback query={query} locale={locale} />

      <AdminWorkspaceGrid
        rail={
          <AdminActionRail
            title={locale === "it" ? "Assegna ruolo" : "分配员工权限"}
            description={locale === "it" ? "L'email deve essere gia registrata." : "邮箱必须已注册为站点用户。"}
          >
            <AdminPanel>
              <form action="/api/admin/accounts/staff" method="post" className="grid gap-2">
                <AdminCsrfField />
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="returnTo" value={localizePath(locale, "/admin/accounts/permissions")} />
                <AdminInput name="email" type="email" label="Email" placeholder="staff@example.it" />
                <AdminSelect name="role" label={locale === "it" ? "Ruolo" : "角色"} defaultValue="support">
                  {staffRoles.map((role) => (
                    <option key={role} value={role}>
                      {staffRoleLabels[role][locale]}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect name="status" label={locale === "it" ? "Stato" : "状态"} defaultValue="active">
                  {staffStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </AdminSelect>
                <button className="h-9 rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
                  {locale === "it" ? "Salva staff" : "保存员工权限"}
                </button>
              </form>
            </AdminPanel>
          </AdminActionRail>
        }
      >
        <section className="grid gap-2 md:grid-cols-3">
          <AdminMetricCard icon={UsersRound} label={locale === "it" ? "Staff" : "员工数"} value={staff.length} tone="blue" />
          <AdminMetricCard icon={ShieldCheck} label={locale === "it" ? "Attivi" : "启用中"} value={activeStaff.length} tone="green" />
          <AdminMetricCard icon={UserCog} label={locale === "it" ? "Ruoli" : "角色"} value={summaries.length} tone="violet" />
        </section>

        <AdminPanel title={locale === "it" ? "Matrice ruoli" : "角色权限矩阵"}>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {summaries.map((summary) => (
              <article key={summary.role} className="rounded-lg border border-black/5 bg-stone-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-stone-950">{summary.label}</h3>
                  <StatusPill status={summary.role} tone={summary.role === "owner" ? "violet" : "blue"} />
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-stone-500">{summary.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {summary.permissions.map((permission) => (
                    <StatusPill key={permission} status={permission} tone="slate" />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title={locale === "it" ? "Staff configurato" : "已配置员工"}>
          <AdminDataTable minWidth={860}>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-stone-400">
                <tr className="border-b border-black/5">
                  <th className="px-2.5 py-2">Staff</th>
                  <th className="px-2.5 py-2">Role</th>
                  <th className="px-2.5 py-2">Status</th>
                  <th className="px-2.5 py-2">Profile</th>
                  <th className="px-2.5 py-2">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-stone-50">
                    <td className="px-2.5 py-2.5">
                      <p className="font-black text-stone-950">{member.fullName ?? member.email}</p>
                      <p className="mt-1 text-xs text-stone-500">{member.email}</p>
                    </td>
                    <td className="px-2.5 py-2.5"><StatusPill status={staffRoleLabels[member.role][locale]} tone={member.role === "owner" ? "violet" : "blue"} /></td>
                    <td className="px-2.5 py-2.5"><StatusPill status={member.status} /></td>
                    <td className="px-2.5 py-2.5 text-xs text-stone-500">{member.profileRole ?? "-"}</td>
                    <td className="px-2.5 py-2.5 text-xs text-stone-500">{member.updatedAt ? new Date(member.updatedAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN") : "-"}</td>
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

function Feedback({
  query,
  locale,
}: Readonly<{ query: Record<string, string | string[] | undefined>; locale: Locale }>) {
  const error = valueOf(query.error);
  if (error) return <AdminNotice tone="danger">{decodeURIComponent(error)}</AdminNotice>;
  if (!valueOf(query.saved)) return null;
  return (
    <AdminNotice tone="success">
      {locale === "it" ? "Permessi aggiornati." : "员工权限已更新。"}
    </AdminNotice>
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
