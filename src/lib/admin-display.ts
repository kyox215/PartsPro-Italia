import type { Locale } from "@/lib/i18n";

export type AdminTone = "default" | "blue" | "green" | "amber" | "red" | "violet" | "slate";

export type AdminStatusKind =
  | "account"
  | "auditAction"
  | "b2bApplication"
  | "crm"
  | "customerSource"
  | "order"
  | "payment"
  | "permission"
  | "priceGroup"
  | "rma"
  | "staffRole"
  | "task";

export type AdminStatusDisplay = {
  label: string;
  tone: AdminTone;
  description?: string;
};

const priceGroupValues = [
  "retail",
  "b2b_pending",
  "b2b_basic",
  "b2b_silver",
  "b2b_gold",
  "distributor",
] as const;

const b2bPriceGroupValues = [
  "b2b_basic",
  "b2b_silver",
  "b2b_gold",
  "distributor",
] as const;

export type CustomerPriceGroup = (typeof priceGroupValues)[number];
export type ApprovedB2BPriceGroup = (typeof b2bPriceGroupValues)[number];

export const customerPriceGroupOptions = [...priceGroupValues];
export const approvedB2BPriceGroupOptions = [...b2bPriceGroupValues];

export const accountStatusOptions = ["active", "suspended", "archived"] as const;
export const b2bStatusOptions = ["pending", "approved", "rejected"] as const;
export const staffStatusOptions = ["active", "suspended", "archived"] as const;
export const crmStatusOptions = [
  "lead",
  "registered",
  "pending",
  "b2b_pending",
  "approved",
  "b2b_approved",
  "approved_pending_signup",
  "active",
  "paused",
  "rejected",
  "b2b_rejected",
  "archived",
] as const;

export function normalizeCustomerPriceGroup(value: string | null | undefined): CustomerPriceGroup {
  return isCustomerPriceGroup(value) ? value : "retail";
}

export function isCustomerPriceGroup(
  value: string | null | undefined,
): value is CustomerPriceGroup {
  return Boolean(value && priceGroupValues.includes(value as CustomerPriceGroup));
}

export function isApprovedB2BPriceGroup(
  value: string | null | undefined,
): value is ApprovedB2BPriceGroup {
  return Boolean(value && b2bPriceGroupValues.includes(value as ApprovedB2BPriceGroup));
}

export function formatAdminStatus(
  kind: AdminStatusKind,
  value: string | null | undefined,
  locale: Locale,
): AdminStatusDisplay {
  const key = normalizeKey(value);
  const fallback = key || "-";
  const table = getStatusLabelsForLocale(locale)[kind] ?? {};
  return table[key] ?? {
    label: fallback,
    tone: "slate",
  };
}

export function formatAdminCount(
  count: number,
  noun: "customers" | "events" | "orders" | "records" | "rma" | "tasks",
  locale: Locale,
) {
  const labels: Record<typeof noun, Record<Locale, string>> = {
    customers: { it: "clienti", zh: "客户" },
    events: { it: "eventi", zh: "条日志" },
    orders: { it: "ordini", zh: "订单" },
    records: { it: "record", zh: "条记录" },
    rma: { it: "RMA", zh: "RMA" },
    tasks: { it: "attivita", zh: "任务" },
  };
  return `${count} ${labels[noun][locale]}`;
}

export function formatAuditDataSummary(data: Record<string, unknown> | null, locale: Locale) {
  if (!data) return "-";
  const entries = Object.entries(data).filter(([, value]) => value !== null && value !== "");
  if (!entries.length) return "-";

  return entries
    .slice(0, 4)
    .map(([key, value]) => `${formatAuditField(key, locale)}: ${formatAuditValue(value, locale)}`)
    .join(" · ");
}

export function formatPermissionLabel(value: string, locale: Locale) {
  return formatAdminStatus("permission", value, locale).label;
}

function normalizeKey(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function entry(
  zh: string,
  it: string,
  tone: AdminTone = "slate",
  description?: Partial<Record<Locale, string>>,
): Record<Locale, AdminStatusDisplay> {
  return {
    zh: { label: zh, tone, description: description?.zh },
    it: { label: it, tone, description: description?.it },
  };
}

function pick(
  localeMap: Record<Locale, AdminStatusDisplay>,
  locale: Locale,
) {
  return localeMap[locale];
}

const rawStatusLabels = {
  account: {
    active: entry("启用中", "Attivo", "green"),
    suspended: entry("已暂停", "Sospeso", "red"),
    archived: entry("已归档", "Archiviato", "slate"),
  },
  auditAction: {
    "b2b_application.status.update": entry("B2B 审核更新", "Revisione B2B aggiornata", "blue"),
    "customer.access.update": entry("客户权限更新", "Accesso cliente aggiornato", "blue"),
    "customer.company.link.create": entry("创建公司档案", "Scheda azienda creata", "green"),
    "customer.company.link.update": entry("更新公司档案", "Scheda azienda aggiornata", "green"),
    "customer.price_group.update": entry("价格组更新", "Price group aggiornato", "violet"),
    "staff.member.create": entry("员工权限创建", "Permesso staff creato", "violet"),
    "staff.member.update": entry("员工权限更新", "Permesso staff aggiornato", "violet"),
    "staff.member.upsert": entry("员工权限保存", "Permesso staff salvato", "violet"),
  },
  b2bApplication: {
    pending: entry("待审核", "Da revisionare", "amber"),
    approved: entry("已通过", "Approvata", "green"),
    rejected: entry("已拒绝", "Rifiutata", "red"),
  },
  crm: {
    lead: entry("线索", "Lead", "amber"),
    registered: entry("已注册", "Registrato", "blue"),
    pending: entry("待处理", "In attesa", "amber"),
    b2b_pending: entry("B2B 待审核", "B2B in revisione", "amber"),
    approved: entry("已通过", "Approvato", "green"),
    b2b_approved: entry("B2B 已通过", "B2B approvato", "green"),
    approved_pending_signup: entry("已通过，待注册", "Approvato, attesa registrazione", "green"),
    active: entry("合作中", "Attivo", "green"),
    paused: entry("暂停跟进", "In pausa", "red"),
    rejected: entry("已拒绝", "Rifiutato", "red"),
    b2b_rejected: entry("B2B 已拒绝", "B2B rifiutato", "red"),
    archived: entry("已归档", "Archiviato", "slate"),
  },
  customerSource: {
    company: entry("公司档案", "Azienda", "slate"),
    application: entry("B2B 申请", "Richiesta B2B", "amber"),
    profile: entry("已注册账号", "Account registrato", "blue"),
  },
  order: {
    pending_payment: entry("待付款", "Pagamento atteso", "amber"),
    processing: entry("处理中", "In lavorazione", "blue"),
    shipped: entry("已发货", "Spedito", "blue"),
    completed: entry("已完成", "Completato", "green"),
    cancelled: entry("已取消", "Annullato", "red"),
    refunded: entry("已退款", "Rimborsato", "red"),
  },
  payment: {
    pending_cash: entry("待现金确认", "Contanti da confermare", "amber"),
    pending_bank_transfer: entry("待转账确认", "Bonifico da confermare", "amber"),
    pending_card: entry("待卡支付", "Carta in attesa", "amber"),
    pending_payment: entry("待付款", "Pagamento atteso", "amber"),
    paid: entry("已付款", "Pagato", "green"),
    failed: entry("付款失败", "Pagamento fallito", "red"),
    refunded: entry("已退款", "Rimborsato", "red"),
    partially_refunded: entry("部分退款", "Rimborso parziale", "amber"),
    "-": entry("未记录", "Non registrato", "slate"),
  },
  permission: {
    "admin:access": entry("进入后台", "Accesso admin", "slate"),
    "accounts:read": entry("查看账号", "Legge account", "blue"),
    "accounts:write": entry("维护账号", "Modifica account", "blue"),
    "b2b:review": entry("审核 B2B", "Revisiona B2B", "amber"),
    "staff:manage": entry("管理员工", "Gestisce staff", "violet"),
    "audit:read": entry("查看日志", "Legge audit", "slate"),
    "products:write": entry("维护商品", "Modifica prodotti", "green"),
    "inventory:write": entry("维护库存", "Modifica stock", "green"),
    "orders:write": entry("处理订单", "Gestisce ordini", "blue"),
    "payments:confirm": entry("确认付款", "Conferma pagamenti", "amber"),
    "rma:write": entry("处理售后", "Gestisce RMA", "red"),
    "system:read": entry("查看系统", "Legge sistema", "slate"),
  },
  priceGroup: {
    retail: entry("零售客户", "Cliente retail", "slate"),
    b2b_pending: entry("B2B 待定价", "B2B da assegnare", "amber"),
    b2b_basic: entry("B2B Basic", "B2B Basic", "green"),
    b2b_silver: entry("B2B Silver", "B2B Silver", "green"),
    b2b_gold: entry("B2B Gold", "B2B Gold", "green"),
    distributor: entry("Distributor", "Distributore", "violet"),
    admin: entry("站内管理员", "Admin sito", "violet"),
    owner: entry("总管理员", "Owner", "violet"),
    sales: entry("销售账号", "Vendite", "blue"),
    catalog: entry("商品账号", "Catalogo", "blue"),
    warehouse: entry("仓库账号", "Magazzino", "blue"),
    finance: entry("财务账号", "Finanza", "blue"),
    support: entry("客服账号", "Supporto", "blue"),
  },
  rma: {
    submitted: entry("已提交", "Inviata", "amber"),
    needs_info: entry("等待补充", "Attesa informazioni", "amber"),
    approved_return: entry("批准寄回", "Reso approvato", "blue"),
    awaiting_receipt: entry("等待收货", "Attesa ricezione", "blue"),
    inspecting: entry("检测中", "In verifica", "blue"),
    approved: entry("已批准", "Approvata", "green"),
    refund_processing: entry("退款处理中", "Rimborso in corso", "amber"),
    replacement_shipped: entry("换货已发出", "Sostituzione spedita", "green"),
    completed: entry("已完成", "Completata", "green"),
    rejected: entry("已拒绝", "Rifiutata", "red"),
  },
  staffRole: {
    owner: entry("老板 / 总管理员", "Owner", "violet"),
    sales: entry("销售 / 客户经理", "Vendite", "blue"),
    catalog: entry("商品目录", "Catalogo", "blue"),
    warehouse: entry("仓库", "Magazzino", "blue"),
    finance: entry("财务", "Finanza", "blue"),
    support: entry("客服售后", "Supporto", "blue"),
    admin: entry("站内管理员", "Admin sito", "violet"),
    retail: entry("零售客户", "Cliente retail", "slate"),
  },
  task: {
    pending: entry("待处理", "Da fare", "amber"),
    open: entry("待处理", "Da fare", "amber"),
    completed: entry("已完成", "Completato", "green"),
    cancelled: entry("已取消", "Annullato", "red"),
  },
} satisfies Record<AdminStatusKind, Record<string, Record<Locale, AdminStatusDisplay>>>;

export function getStatusLabelsForLocale(locale: Locale) {
  return Object.fromEntries(
    Object.entries(rawStatusLabels).map(([kind, values]) => [
      kind,
      Object.fromEntries(
        Object.entries(values).map(([value, localeMap]) => [value, pick(localeMap, locale)]),
      ),
    ]),
  ) as Record<AdminStatusKind, Record<string, AdminStatusDisplay>>;
}

function formatAuditField(key: string, locale: Locale) {
  const labels: Record<string, Record<Locale, string>> = {
    accountStatus: { zh: "账号状态", it: "Stato account" },
    companyId: { zh: "公司", it: "Azienda" },
    crmStatus: { zh: "CRM", it: "CRM" },
    nextFollowUpAt: { zh: "下次跟进", it: "Prossimo follow-up" },
    priceGroup: { zh: "价格组", it: "Gruppo prezzi" },
    profileId: { zh: "账号", it: "Profilo" },
    status: { zh: "状态", it: "Stato" },
    syncedCustomer: { zh: "已同步客户", it: "Cliente sincronizzato" },
  };
  return labels[key]?.[locale] ?? key;
}

function formatAuditValue(value: unknown, locale: Locale) {
  if (typeof value === "boolean") {
    return value
      ? locale === "it"
        ? "si"
        : "是"
      : locale === "it"
        ? "no"
        : "否";
  }
  if (typeof value === "string") {
    const price = formatAdminStatus("priceGroup", value, locale);
    const crm = formatAdminStatus("crm", value, locale);
    const account = formatAdminStatus("account", value, locale);
    if (price.label !== value) return price.label;
    if (crm.label !== value) return crm.label;
    if (account.label !== value) return account.label;
  }
  return String(value);
}

export function localizedStatus(kind: AdminStatusKind, value: string | null | undefined, locale: Locale) {
  return formatAdminStatus(kind, value, locale);
}
