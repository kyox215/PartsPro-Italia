import type { AuthContext } from "@/lib/auth";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

export type StaffRole = string;

export type AdminPermission =
  | "admin:access"
  | "accounts:read"
  | "accounts:write"
  | "staff:manage"
  | "audit:read"
  | "products:write"
  | "inventory:write"
  | "orders:write"
  | "payments:confirm"
  | "system:read";

export const staffRoleOptions: StaffRole[] = [
  "owner",
  "manager",
  "sales",
  "catalog",
  "warehouse",
  "finance",
  "support",
];

export const staffRoleLabels: Record<string, { zh: string; it: string }> = {
  owner: { zh: "总管理员", it: "Owner" },
  manager: { zh: "运营管理", it: "Responsabile operativo" },
  sales: { zh: "销售 / 客户经理", it: "Vendite" },
  catalog: { zh: "商品目录", it: "Catalogo" },
  warehouse: { zh: "仓库", it: "Magazzino" },
  finance: { zh: "财务", it: "Finanza" },
  support: { zh: "客服 / 跟进", it: "Supporto" },
};

export const staffRoleDescriptions: Record<string, { zh: string; it: string }> = {
  owner: {
    zh: "全部后台权限，可管理员工、角色权限、客户、订单、库存、财务和系统配置。",
    it: "Accesso completo a staff, clienti, ordini, stock, finanza e sistema.",
  },
  manager: {
    zh: "运营工作台全局管理，能处理客户、商品、库存、订单和日志，但不默认拥有系统配置。",
    it: "Gestione operativa completa senza accesso sistema predefinito.",
  },
  sales: {
    zh: "客户管理、价格权限、客户跟进和订单协作。",
    it: "Gestione clienti, price group e follow-up commerciali.",
  },
  catalog: {
    zh: "商品、翻译、价格、目录和导入维护。",
    it: "Prodotti, traduzioni, prezzi, catalogo e import.",
  },
  warehouse: {
    zh: "库存、到货、备货、发货和自提处理。",
    it: "Stock, arrivi, picking, spedizioni e ritiro.",
  },
  finance: {
    zh: "确认现金/转账、退款、付款状态和财务筛选。",
    it: "Incassi, bonifici, rimborsi e stati pagamento.",
  },
  support: {
    zh: "客户资料查看、客户跟进、备注和任务。",
    it: "Profilo cliente, assistenza, note e task.",
  },
};

export function getStaffRoleLabel(role: StaffRole | null | undefined, locale: "it" | "zh") {
  if (!role) return locale === "it" ? "Staff" : "员工";
  return staffRoleLabels[role]?.[locale] ?? role;
}

export function getStaffRoleDescription(role: StaffRole | null | undefined, locale: "it" | "zh") {
  if (!role) return "";
  return (
    staffRoleDescriptions[role]?.[locale] ??
    (locale === "it"
      ? "Ruolo personalizzato configurato nel centro impostazioni."
      : "设置中心配置的自定义职位。")
  );
}

const allPermissions: AdminPermission[] = [
  "admin:access",
  "accounts:read",
  "accounts:write",
  "staff:manage",
  "audit:read",
  "products:write",
  "inventory:write",
  "orders:write",
  "payments:confirm",
  "system:read",
];

const configurablePermissions: AdminPermission[] = allPermissions;

const staffPermissions: Record<string, AdminPermission[]> = {
  owner: allPermissions,
  manager: [
    "admin:access",
    "accounts:read",
    "accounts:write",
    "staff:manage",
    "audit:read",
    "products:write",
    "inventory:write",
    "orders:write",
    "payments:confirm",
  ],
  sales: [
    "admin:access",
    "accounts:read",
    "accounts:write",
    "audit:read",
    "orders:write",
  ],
  catalog: ["admin:access", "products:write", "system:read"],
  warehouse: ["admin:access", "inventory:write", "orders:write", "system:read"],
  finance: [
    "admin:access",
    "orders:write",
    "payments:confirm",
    "audit:read",
    "system:read",
  ],
  support: ["admin:access", "accounts:read", "audit:read"],
};

export function getStaffPermissions(role: StaffRole | null | undefined) {
  return role ? staffPermissions[role] ?? [] : [];
}

export async function getStaffPermissionsForRole(role: StaffRole | null | undefined) {
  if (!role) return [];
  if (role === "owner" || !hasSupabaseAdminConfig()) return getStaffPermissions(role);

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("staff_role_permissions")
    .select("permission, enabled")
    .eq("role", role);

  if (error) {
    console.error("Failed to load staff role permissions", error.message);
    return getStaffPermissions(role);
  }

  const permissions = (data ?? [])
    .filter((row) => row.enabled && isAdminPermission(row.permission))
    .map((row) => row.permission as AdminPermission);

  return (data ?? []).length ? permissions : getStaffPermissions(role);
}

export async function getStaffPermissionMatrix() {
  const matrix = Object.fromEntries(
    staffRoleOptions.map((role) => [role, getStaffPermissions(role)]),
  ) as Record<string, AdminPermission[]>;

  if (!hasSupabaseAdminConfig()) return matrix;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("staff_role_permissions")
    .select("role, permission, enabled");

  if (error) {
    console.error("Failed to load staff permission matrix", error.message);
    return matrix;
  }

  const grouped = new Map<StaffRole, AdminPermission[]>();
  const seenRoles = new Set<StaffRole>();
  (data ?? []).forEach((row) => {
    if (!isStaffRole(row.role) || !isAdminPermission(row.permission)) return;
    seenRoles.add(row.role);
    if (row.enabled) grouped.set(row.role, [...(grouped.get(row.role) ?? []), row.permission]);
  });

  seenRoles.forEach((role) => {
    if (role === "owner") matrix[role] = getStaffPermissions(role);
    else matrix[role] = grouped.get(role) ?? matrix[role] ?? [];
  });

  return matrix;
}

export function getAllAdminPermissions() {
  return allPermissions;
}

export function getConfigurableAdminPermissions() {
  return configurablePermissions;
}

export function isStaffRole(value: string | null | undefined): value is StaffRole {
  return Boolean(value && /^[a-z][a-z0-9_-]{1,40}$/.test(value));
}

export function isAdminPermission(value: string | null | undefined): value is AdminPermission {
  return Boolean(value && allPermissions.includes(value as AdminPermission));
}

export function hasAdminPermission(
  auth: Pick<AuthContext, "isAdmin" | "staffRole" | "adminPermissions">,
  permission: AdminPermission,
) {
  if (auth.isAdmin) return true;
  return auth.adminPermissions.includes(permission);
}
