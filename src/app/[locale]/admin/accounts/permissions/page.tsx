import { ChevronDown, ShieldCheck, UserCog, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminCsrfField } from "@/components/admin/admin-csrf-field";
import {
  AdminEmptyState,
  AdminInput,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminRecordList,
  AdminSelect,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import { formatAdminStatus, formatCustomerType, formatPermissionLabel } from "@/lib/admin-display";
import { getAdminStaffRows, getStaffRoleSummaries } from "@/lib/admin-accounts";
import {
  type AdminPermission,
  type StaffRole,
  getConfigurableAdminPermissions,
  getStaffRoleLabel,
  hasAdminPermission,
} from "@/lib/admin-permissions";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

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
  const summaries = await getStaffRoleSummaries(locale);
  const configurablePermissions = getConfigurableAdminPermissions();
  const activeStaff = staff.filter((member) => member.status === "active");

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Centro impostazioni" : "设置中心"}
        title={locale === "it" ? "Permessi staff" : "权限管理"}
        description={
          locale === "it"
            ? "Assegna staff registrato e configura menu/azioni per ruoli predefiniti o personalizzati."
            : "用已注册邮箱分配员工，并为默认或自定义职位配置菜单与关键操作权限。"
        }
      />

      <Feedback query={query} locale={locale} />

      <AdminWorkspaceGrid
        rail={
          <div className="space-y-3">
            <AdminPanel title={locale === "it" ? "Assegna staff" : "分配员工"}>
              <form action="/api/admin/accounts/staff" method="post" className="space-y-2">
                <AdminCsrfField />
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="returnTo" value={localizePath(locale, "/admin/settings/permissions")} />
                <AdminInput name="email" type="email" label={locale === "it" ? "Email registrata" : "已注册邮箱"} placeholder="user@company.com" />
                <AdminSelect name="role" label={locale === "it" ? "Ruolo" : "职位"} defaultValue="sales">
                  {summaries.map((summary) => (
                    <option key={summary.role} value={summary.role}>
                      {summary.label}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect name="status" label={locale === "it" ? "Stato" : "状态"} defaultValue="active">
                  <option value="active">{formatAdminStatus("account", "active", locale).label}</option>
                  <option value="suspended">{formatAdminStatus("account", "suspended", locale).label}</option>
                  <option value="archived">{formatAdminStatus("account", "archived", locale).label}</option>
                </AdminSelect>
                <button className="h-9 w-full rounded-lg bg-blue-600 px-3 text-xs font-black text-white" type="submit">
                  {locale === "it" ? "Salva staff" : "保存员工"}
                </button>
              </form>
            </AdminPanel>
            <AdminPanel title={locale === "it" ? "Ruolo personalizzato" : "自定义职位"}>
              <form action="/api/admin/accounts/roles" method="post" className="space-y-2">
                <AdminCsrfField />
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="returnTo" value={localizePath(locale, "/admin/settings/permissions")} />
                <input type="hidden" name="action" value="create" />
                <AdminInput
                  name="role"
                  label={locale === "it" ? "Codice ruolo" : "职位代码"}
                  placeholder="after_sales"
                  pattern="[a-z][a-z0-9_-]{1,40}"
                />
                <button className="h-9 w-full rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700" type="submit">
                  {locale === "it" ? "Crea ruolo" : "新增职位"}
                </button>
              </form>
            </AdminPanel>
          </div>
        }
      >
        <section className="grid gap-2 md:grid-cols-3">
          <AdminMetricCard icon={UsersRound} label={locale === "it" ? "Staff" : "员工数"} value={staff.length} tone="blue" />
          <AdminMetricCard icon={ShieldCheck} label={locale === "it" ? "Attivi" : "启用中"} value={activeStaff.length} tone="green" />
          <AdminMetricCard icon={UserCog} label={locale === "it" ? "Ruoli" : "角色"} value={summaries.length} tone="violet" />
        </section>

        <AdminPanel title={locale === "it" ? "Matrice ruoli" : "角色权限矩阵"}>
          <div className="space-y-2">
            {summaries.map((summary) => (
              <RolePermissionRow
                key={summary.role}
                locale={locale}
                label={summary.label}
                description={summary.description}
                role={summary.role}
                permissions={summary.permissions}
                configurablePermissions={configurablePermissions}
              />
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title={locale === "it" ? "Staff configurato" : "已配置员工"}>
          {staff.length > 0 ? (
            <AdminRecordList>
              {staff.map((member) => {
                const status = formatAdminStatus("account", member.status, locale);
                const profileRole = member.profileRole
                  ? member.profileRole === "admin"
                    ? formatAdminStatus("staffRole", "admin", locale)
                    : formatCustomerType(member.profileRole, locale)
                  : null;
                return (
                  <article
                    key={member.id}
                    className="grid min-w-0 gap-3 rounded-lg bg-stone-50 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-black text-stone-950">{member.fullName ?? member.email}</p>
                      <p className="mt-1 break-words text-xs font-semibold text-stone-500">{member.email}</p>
                      <p className="mt-1 text-xs font-semibold text-stone-400">
                        {locale === "it" ? "Aggiornato" : "更新时间"}:{" "}
                        {member.updatedAt ? new Date(member.updatedAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN") : "-"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 md:justify-end">
                      <StatusPill status={getStaffRoleLabel(member.role, locale)} tone={member.role === "owner" ? "violet" : "blue"} />
                      <StatusPill status={status.label} tone={status.tone} />
                      {profileRole ? <StatusPill status={profileRole.label} tone={profileRole.tone} /> : null}
                    </div>
                  </article>
                );
              })}
            </AdminRecordList>
          ) : (
            <AdminEmptyState
              icon={UserCog}
              title={locale === "it" ? "Nessuno staff configurato" : "暂无已配置员工"}
              description={
                locale === "it"
                  ? "Assegna un ruolo staff nella scheda cliente per vederlo qui."
                  : "在客户详情里分配员工角色后，会显示在这里。"
              }
            />
          )}
        </AdminPanel>
      </AdminWorkspaceGrid>
    </div>
  );
}

function RolePermissionRow({
  locale,
  label,
  description,
  role,
  permissions,
  configurablePermissions,
}: Readonly<{
  locale: Locale;
  label: string;
  description: string;
  role: StaffRole;
  permissions: AdminPermission[];
  configurablePermissions: AdminPermission[];
}>) {
  const permissionSet = new Set(permissions);
  const previewPermissions = permissions.slice(0, 4);
  const hiddenCount = Math.max(permissions.length - previewPermissions.length, 0);
  const totalCount = configurablePermissions.length;
  const isOwner = role === "owner";

  return (
    <details className="group rounded-lg border border-black/5 bg-stone-50">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-stone-950">{label}</h3>
            <StatusPill
              status={isOwner ? (locale === "it" ? "Solo lettura" : "只读") : `${permissions.length}/${totalCount}`}
              tone={isOwner ? "violet" : "blue"}
            />
            {previewPermissions.map((permission) => (
              <StatusPill key={permission} status={formatPermissionLabel(permission, locale)} tone="slate" />
            ))}
            {hiddenCount > 0 ? <span className="text-xs font-black text-stone-400">+{hiddenCount}</span> : null}
          </div>
          <p className="mt-1 line-clamp-1 text-xs font-semibold text-stone-500">{description}</p>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-stone-400 transition group-open:rotate-180" />
      </summary>

      <div className="border-t border-black/5 px-3 pb-3 pt-2">
        {isOwner ? (
          <div className="flex flex-wrap gap-1.5">
            {permissions.map((permission) => (
              <StatusPill key={permission} status={formatPermissionLabel(permission, locale)} tone="slate" />
            ))}
          </div>
        ) : (
          <form action="/api/admin/accounts/permissions/matrix" method="post" className="grid gap-2">
            <AdminCsrfField />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="returnTo" value={localizePath(locale, "/admin/settings/permissions")} />
            <input type="hidden" name="role" value={role} />
            <div className="grid gap-1.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {configurablePermissions.map((permission) => (
                <CompactPermissionToggle
                  key={permission}
                  name={`permission:${permission}`}
                  label={formatPermissionLabel(permission, locale)}
                  defaultChecked={permissionSet.has(permission)}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="h-8 rounded-lg bg-blue-600 px-3 text-xs font-black text-white" type="submit">
                {locale === "it" ? "Salva matrice" : "保存权限矩阵"}
              </button>
            </div>
          </form>
        )}
        {!isOwner && !["manager", "sales", "catalog", "warehouse", "finance", "support"].includes(role) ? (
          <div className="mt-2 flex flex-wrap gap-2 border-t border-black/5 pt-2">
            <form action="/api/admin/accounts/roles" method="post" className="flex flex-wrap gap-2">
              <AdminCsrfField />
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="returnTo" value={localizePath(locale, "/admin/settings/permissions")} />
              <input type="hidden" name="action" value="deactivate" />
              <input type="hidden" name="role" value={role} />
              <button className="h-8 rounded-lg border border-red-200 px-3 text-xs font-black text-red-600" type="submit">
                {locale === "it" ? "Disattiva ruolo" : "停用职位"}
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </details>
  );
}

function CompactPermissionToggle({
  label,
  name,
  defaultChecked,
}: Readonly<{
  label: string;
  name: string;
  defaultChecked: boolean;
}>) {
  return (
    <label className="flex h-8 min-w-0 items-center gap-2 rounded-full border border-black/10 bg-white px-2.5 text-xs font-black text-stone-700">
      <input
        type="checkbox"
        name={name}
        value="true"
        defaultChecked={defaultChecked}
        className="h-3.5 w-3.5 shrink-0 accent-stone-950"
      />
      <span className="truncate">{label}</span>
    </label>
  );
}

function Feedback({
  query,
  locale,
}: Readonly<{ query: Record<string, string | string[] | undefined>; locale: Locale }>) {
  const error = valueOf(query.error);
  if (error) return <AdminNotice tone="danger">{formatStaffFeedback(error, locale)}</AdminNotice>;
  if (!valueOf(query.saved)) return null;
  return (
    <AdminNotice tone="success">
      {locale === "it" ? "Permessi aggiornati." : "员工权限已更新。"}
    </AdminNotice>
  );
}

function formatStaffFeedback(error: string, locale: Locale) {
  const decoded = decodeURIComponent(error);
  if (decoded.includes("No registered profile found")) {
    return locale === "it"
      ? "Questa email non ha ancora un account registrato. Falla accedere una volta al sito, poi assegna i permessi."
      : "这个邮箱还没有注册站点账号。请先让该邮箱注册或登录一次，再分配员工权限。";
  }
  if (decoded.includes("Only owner/admin can assign owner role")) {
    return locale === "it"
      ? "Solo owner o amministratori possono assegnare il ruolo owner."
      : "只有老板/总管理员可以分配老板角色。";
  }
  return decoded;
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
