import type { AuthContext } from "@/lib/auth";

type LegacyAdminPermission =
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

export type AdminPermission =
  | "admin:access"
  | "orders:read"
  | "orders:write"
  | "customers:read"
  | "customers:write"
  | "inventory:read"
  | "inventory:write"
  | "products:read"
  | "products:write"
  | "finance:read"
  | "finance:write"
  | "staff:read"
  | "staff:write"
  | "settings:read"
  | "settings:write"
  | "audit:read";

export type AdminPermissionCode = AdminPermission | LegacyAdminPermission;

export const adminPermissions: AdminPermission[] = [
  "admin:access",
  "orders:read",
  "orders:write",
  "customers:read",
  "customers:write",
  "inventory:read",
  "inventory:write",
  "products:read",
  "products:write",
  "finance:read",
  "finance:write",
  "staff:read",
  "staff:write",
  "settings:read",
  "settings:write",
  "audit:read",
];

export const adminPermissionLabels: Record<AdminPermission, { zh: string; it: string }> = {
  "admin:access": { zh: "进入后台", it: "Accesso admin" },
  "orders:read": { zh: "查看订单", it: "Legge ordini" },
  "orders:write": { zh: "处理订单", it: "Modifica ordini" },
  "customers:read": { zh: "查看客户", it: "Legge clienti" },
  "customers:write": { zh: "维护客户", it: "Modifica clienti" },
  "inventory:read": { zh: "查看库存", it: "Legge inventario" },
  "inventory:write": { zh: "维护库存", it: "Modifica inventario" },
  "products:read": { zh: "查看商品", it: "Legge prodotti" },
  "products:write": { zh: "维护商品", it: "Modifica prodotti" },
  "finance:read": { zh: "查看财务", it: "Legge finanza" },
  "finance:write": { zh: "处理财务", it: "Modifica finanza" },
  "staff:read": { zh: "查看员工", it: "Legge staff" },
  "staff:write": { zh: "维护员工权限", it: "Modifica staff" },
  "settings:read": { zh: "查看设置", it: "Legge impostazioni" },
  "settings:write": { zh: "维护设置", it: "Modifica impostazioni" },
  "audit:read": { zh: "查看审计日志", it: "Legge audit log" },
};

const legacyToNewPermissions: Record<LegacyAdminPermission, AdminPermission[]> = {
  "admin:access": ["admin:access"],
  "accounts:read": ["customers:read", "staff:read"],
  "accounts:write": ["customers:write"],
  "staff:manage": ["staff:write", "settings:write"],
  "audit:read": ["audit:read"],
  "products:write": ["products:write"],
  "inventory:write": ["inventory:write"],
  "orders:write": ["orders:write"],
  "payments:confirm": ["finance:write"],
  "system:read": ["settings:read"],
};

const newToLegacyPermissions: Record<AdminPermission, LegacyAdminPermission[]> = {
  "admin:access": ["admin:access"],
  "orders:read": ["orders:write"],
  "orders:write": ["orders:write"],
  "customers:read": ["accounts:read"],
  "customers:write": ["accounts:write"],
  "inventory:read": ["inventory:write"],
  "inventory:write": ["inventory:write"],
  "products:read": ["products:write"],
  "products:write": ["products:write"],
  "finance:read": ["payments:confirm"],
  "finance:write": ["payments:confirm"],
  "staff:read": ["staff:manage", "accounts:read"],
  "staff:write": ["staff:manage"],
  "settings:read": ["system:read"],
  "settings:write": ["staff:manage"],
  "audit:read": ["audit:read"],
};

export function hasAdminPermissionCode(
  auth: Pick<AuthContext, "isAdmin" | "adminPermissions">,
  permission: AdminPermissionCode,
) {
  if (auth.isAdmin) return true;

  const granted = new Set<string>(auth.adminPermissions);
  if (granted.has(permission)) return true;

  const legacyMatches = newToLegacyPermissions[permission as AdminPermission] ?? [];
  if (legacyMatches.some((legacy) => granted.has(legacy))) return true;

  const newMatches = legacyToNewPermissions[permission as LegacyAdminPermission] ?? [];
  return newMatches.some((nextPermission) => granted.has(nextPermission));
}

export function isNewAdminPermission(value: string): value is AdminPermission {
  return adminPermissions.includes(value as AdminPermission);
}
