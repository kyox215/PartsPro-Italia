import type { AuthContext } from "@/lib/auth";

export type StaffRole =
  | "owner"
  | "sales"
  | "catalog"
  | "warehouse"
  | "finance"
  | "support";

export type AdminPermission =
  | "admin:access"
  | "accounts:read"
  | "accounts:write"
  | "b2b:review"
  | "staff:manage"
  | "audit:read"
  | "products:write"
  | "inventory:write"
  | "orders:write"
  | "payments:confirm"
  | "rma:write"
  | "system:read";

export const staffRoleLabels: Record<StaffRole, { zh: string; it: string }> = {
  owner: { zh: "老板 / 总管理员", it: "Owner" },
  sales: { zh: "销售 / 客户经理", it: "Vendite" },
  catalog: { zh: "商品目录", it: "Catalogo" },
  warehouse: { zh: "仓库", it: "Magazzino" },
  finance: { zh: "财务", it: "Finanza" },
  support: { zh: "客服售后", it: "Supporto" },
};

export const staffRoleDescriptions: Record<StaffRole, { zh: string; it: string }> = {
  owner: {
    zh: "全部后台权限，可管理员工、客户、订单、库存、财务和系统配置。",
    it: "Accesso completo a staff, clienti, ordini, stock, finanza e sistema.",
  },
  sales: {
    zh: "客户管理、B2B 审核、客户跟进，可分配普通 B2B 价格组。",
    it: "Gestione clienti, revisioni B2B e follow-up commerciali.",
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
    zh: "客户资料查看、RMA、售后、备注和任务。",
    it: "Profilo cliente, RMA, assistenza, note e task.",
  },
};

const allPermissions: AdminPermission[] = [
  "admin:access",
  "accounts:read",
  "accounts:write",
  "b2b:review",
  "staff:manage",
  "audit:read",
  "products:write",
  "inventory:write",
  "orders:write",
  "payments:confirm",
  "rma:write",
  "system:read",
];

const staffPermissions: Record<StaffRole, AdminPermission[]> = {
  owner: allPermissions,
  sales: [
    "admin:access",
    "accounts:read",
    "accounts:write",
    "b2b:review",
    "audit:read",
    "orders:write",
    "rma:write",
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
  support: ["admin:access", "accounts:read", "rma:write", "audit:read"],
};

export function getStaffPermissions(role: StaffRole | null | undefined) {
  return role ? staffPermissions[role] ?? [] : [];
}

export function getAllAdminPermissions() {
  return allPermissions;
}

export function isStaffRole(value: string | null | undefined): value is StaffRole {
  return Boolean(value && value in staffPermissions);
}

export function hasAdminPermission(
  auth: Pick<AuthContext, "isAdmin" | "staffRole" | "adminPermissions">,
  permission: AdminPermission,
) {
  if (auth.isAdmin) return true;
  return auth.adminPermissions.includes(permission);
}
