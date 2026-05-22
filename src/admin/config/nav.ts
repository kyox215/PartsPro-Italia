import { localizePath, type Locale } from "@/lib/i18n";
import type { AdminPermissionCode } from "./permissions";

export type AdminNavIcon =
  | "audit"
  | "customers"
  | "dashboard"
  | "finance"
  | "inventory"
  | "orders"
  | "products"
  | "settings"
  | "staff"
  | "system";

export type AdminNavItem = {
  key: string;
  href: string;
  label: string;
  description?: string;
  icon: AdminNavIcon;
  permission?: AdminPermissionCode;
  children?: AdminNavItem[];
};

type NavCopy = {
  zh: {
    label: string;
    description?: string;
  };
  it: {
    label: string;
    description?: string;
  };
};

const copy = (locale: Locale, value: NavCopy) => value[locale];

export function getAdminNavItems(locale: Locale): AdminNavItem[] {
  const item = (
    key: string,
    path: string,
    icon: AdminNavIcon,
    labels: NavCopy,
    options: {
      permission?: AdminPermissionCode;
      children?: AdminNavItem[];
    } = {},
  ): AdminNavItem => {
    const text = copy(locale, labels);

    return {
      key,
      href: localizePath(locale, path),
      label: text.label,
      description: text.description,
      icon,
      permission: options.permission,
      children: options.children,
    };
  };

  return [
    item("dashboard", "/admin", "dashboard", {
      zh: { label: "工作台", description: "今日待办与关键指标" },
      it: { label: "Dashboard", description: "Task e metriche" },
    }),
    item(
      "orders",
      "/admin/orders",
      "orders",
      {
        zh: { label: "订单中心", description: "状态、收款、履约" },
        it: { label: "Ordini", description: "Stati, pagamenti, logistica" },
      },
      {
        permission: "orders:read",
        children: [
          item("orders.list", "/admin/orders", "orders", {
            zh: { label: "订单列表" },
            it: { label: "Lista ordini" },
          }, { permission: "orders:read" }),
          item("orders.timeline", "/admin/orders/timeline", "audit", {
            zh: { label: "订单时间线" },
            it: { label: "Timeline ordini" },
          }, { permission: "orders:read" }),
        ],
      },
    ),
    item(
      "customers",
      "/admin/accounts/customers",
      "customers",
      {
        zh: { label: "客户中心", description: "客户、公司、跟进" },
        it: { label: "Clienti", description: "Clienti, aziende, follow-up" },
      },
      { permission: "customers:read" },
    ),
    item(
      "inventory",
      "/admin/inventory",
      "inventory",
      {
        zh: { label: "库存中心", description: "现货、在途、流水" },
        it: { label: "Inventario", description: "Stock, arrivi, movimenti" },
      },
      {
        permission: "inventory:read",
        children: [
          item("inventory.overview", "/admin/inventory", "inventory", {
            zh: { label: "库存总览" },
            it: { label: "Panoramica" },
          }, { permission: "inventory:read" }),
          item("inventory.import", "/admin/inventory/import", "products", {
            zh: { label: "采购导入" },
            it: { label: "Import fornitore" },
          }, { permission: "inventory:write" }),
          item("inventory.incoming", "/admin/inventory/incoming", "inventory", {
            zh: { label: "到货/缺货" },
            it: { label: "Arrivi / ammanchi" },
          }, { permission: "inventory:write" }),
          item("inventory.movements", "/admin/inventory/movements", "audit", {
            zh: { label: "库存流水" },
            it: { label: "Movimenti" },
          }, { permission: "inventory:read" }),
        ],
      },
    ),
    item(
      "products",
      "/admin/products",
      "products",
      {
        zh: { label: "商品中心", description: "SKU、价格、上下架" },
        it: { label: "Prodotti", description: "SKU, prezzi, pubblicazione" },
      },
      { permission: "products:read" },
    ),
    item(
      "finance",
      "/admin/orders?filter=pending_payment",
      "finance",
      {
        zh: { label: "财务中心", description: "付款确认与退款" },
        it: { label: "Finanza", description: "Pagamenti e rimborsi" },
      },
      { permission: "finance:read" },
    ),
    item(
      "staff",
      "/admin/accounts",
      "staff",
      {
        zh: { label: "员工权限", description: "员工、角色、审计" },
        it: { label: "Staff", description: "Staff, ruoli, audit" },
      },
      {
        permission: "staff:read",
        children: [
          item("staff.accounts", "/admin/accounts", "staff", {
            zh: { label: "员工与账号" },
            it: { label: "Staff e account" },
          }, { permission: "staff:read" }),
          item("staff.permissions", "/admin/accounts/permissions", "settings", {
            zh: { label: "权限矩阵" },
            it: { label: "Matrice permessi" },
          }, { permission: "staff:write" }),
          item("staff.audit", "/admin/accounts/audit-log", "audit", {
            zh: { label: "操作日志" },
            it: { label: "Audit log" },
          }, { permission: "audit:read" }),
        ],
      },
    ),
    item(
      "settings",
      "/admin/settings",
      "settings",
      {
        zh: { label: "系统设置", description: "订单、库存、系统健康" },
        it: { label: "Impostazioni", description: "Ordini, stock, sistema" },
      },
      {
        permission: "settings:read",
        children: [
          item("settings.index", "/admin/settings", "settings", {
            zh: { label: "设置总览" },
            it: { label: "Panoramica" },
          }, { permission: "settings:read" }),
          item("settings.products", "/admin/settings/products", "products", {
            zh: { label: "商品设置" },
            it: { label: "Impostazioni prodotti" },
          }, { permission: "products:write" }),
          item("settings.inventory", "/admin/settings/inventory", "inventory", {
            zh: { label: "库存设置" },
            it: { label: "Impostazioni stock" },
          }, { permission: "inventory:write" }),
          item("settings.orders", "/admin/settings/orders", "orders", {
            zh: { label: "订单设置" },
            it: { label: "Impostazioni ordini" },
          }, { permission: "orders:write" }),
          item("settings.system", "/admin/system", "system", {
            zh: { label: "系统健康" },
            it: { label: "Salute sistema" },
          }, { permission: "settings:read" }),
        ],
      },
    ),
  ];
}
