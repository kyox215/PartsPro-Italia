import type { Locale } from "@/lib/i18n";

export type AdminTone = "default" | "blue" | "green" | "amber" | "red" | "violet" | "slate";

export type AdminStatusKind =
  | "account"
  | "auditAction"
  | "crm"
  | "customerSource"
  | "fulfillment"
  | "fulfillmentType"
  | "notification"
  | "order"
  | "payment"
  | "paymentMethod"
  | "permission"
  | "priceGroup"
  | "refundReason"
  | "refundStatus"
  | "staffRole"
  | "task"
  | "timelineEvent";

export type AdminStatusDisplay = {
  label: string;
  tone: AdminTone;
  description?: string;
};

const priceGroupValues = [
  "retail",
  "wholesale",
  "b2b_pending",
  "b2b_basic",
  "b2b_silver",
  "b2b_gold",
  "distributor",
] as const;

const customerTypeValues = ["retail", "wholesale"] as const;
const b2bPriceGroupValues = [
  "b2b_basic",
  "b2b_silver",
  "b2b_gold",
  "distributor",
] as const;

export type CustomerPriceGroup = (typeof priceGroupValues)[number];
export type CustomerType = (typeof customerTypeValues)[number];
type ApprovedB2BPriceGroup = (typeof b2bPriceGroupValues)[number];

export const customerPriceGroupOptions = [...priceGroupValues];
export const customerTypeOptions = [...customerTypeValues];

export const accountStatusOptions = ["active", "suspended", "archived"] as const;
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
  const key = normalizeKey(value);
  if (key === "wholesale") return "wholesale";
  return isCustomerPriceGroup(key) ? key : "retail";
}

export function normalizeCustomerType(value: string | null | undefined): CustomerType {
  return isWholesaleCustomerValue(value) ? "wholesale" : "retail";
}

export function toStoredCustomerPriceGroup(type: CustomerType) {
  return type === "wholesale" ? "b2b_basic" : "retail";
}

export function isWholesaleCustomerValue(value: string | null | undefined) {
  const key = normalizeKey(value);
  return key === "wholesale" || b2bPriceGroupValues.includes(key as ApprovedB2BPriceGroup);
}

export function isCustomerPriceGroup(
  value: string | null | undefined,
): value is CustomerPriceGroup {
  return Boolean(value && priceGroupValues.includes(value as CustomerPriceGroup));
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
  noun: "customers" | "events" | "orders" | "records" | "tasks",
  locale: Locale,
) {
  const labels: Record<typeof noun, Record<Locale, string>> = {
    customers: { it: "clienti", zh: "客户" },
    events: { it: "eventi", zh: "条日志" },
    orders: { it: "ordini", zh: "订单" },
    records: { it: "record", zh: "条记录" },
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

export function formatCustomerType(value: string | null | undefined, locale: Locale) {
  return formatAdminStatus("priceGroup", normalizeCustomerType(value), locale);
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
    "customer.access.update": entry("客户权限更新", "Accesso cliente aggiornato", "blue"),
    "customer.company.link.create": entry("创建公司档案", "Scheda azienda creata", "green"),
    "customer.company.link.update": entry("更新公司档案", "Scheda azienda aggiornata", "green"),
    "customer.price_group.update": entry("价格组更新", "Price group aggiornato", "violet"),
    "staff.member.create": entry("员工权限创建", "Permesso staff creato", "violet"),
    "staff.member.update": entry("员工权限更新", "Permesso staff aggiornato", "violet"),
    "staff.member.upsert": entry("员工权限保存", "Permesso staff salvato", "violet"),
    "staff.matrix.update": entry("角色权限矩阵更新", "Matrice permessi aggiornata", "violet"),
  },
  crm: {
    lead: entry("线索", "Lead", "amber"),
    registered: entry("已注册", "Registrato", "blue"),
    pending: entry("待处理", "In attesa", "amber"),
    b2b_pending: entry("待分配价格权限", "Price group da assegnare", "amber"),
    approved: entry("已通过", "Approvato", "green"),
    b2b_approved: entry("价格权限已通过", "Price group approvato", "green"),
    approved_pending_signup: entry("已通过，待注册", "Approvato, attesa registrazione", "green"),
    active: entry("合作中", "Attivo", "green"),
    paused: entry("暂停跟进", "In pausa", "red"),
    rejected: entry("已拒绝", "Rifiutato", "red"),
    b2b_rejected: entry("价格权限未通过", "Price group rifiutato", "red"),
    archived: entry("已归档", "Archiviato", "slate"),
  },
  customerSource: {
    company: entry("公司档案", "Azienda", "slate"),
    profile: entry("已注册账号", "Account registrato", "blue"),
  },
  fulfillment: {
    unfulfilled: entry("未履约", "Da evadere", "slate"),
    reserved: entry("已锁库", "Stock riservato", "blue"),
    awaiting_preorder: entry("等待预购到货", "Attesa preorder", "amber"),
    picking: entry("备货中", "Picking", "blue"),
    shipped: entry("已发货", "Spedito", "green"),
    picked_up: entry("已自提", "Ritirato", "green"),
    completed: entry("已完成", "Completato", "green"),
    cancelled: entry("已取消", "Annullato", "red"),
    "-": entry("未记录", "Non registrato", "slate"),
  },
  fulfillmentType: {
    stock: entry("现货", "Stock", "green"),
    preorder: entry("预购", "Preorder", "amber"),
    mixed: entry("混合", "Misto", "blue"),
    unknown: entry("未记录", "Non registrato", "slate"),
    "-": entry("未记录", "Non registrato", "slate"),
  },
  notification: {
    pending: entry("待发送", "Da inviare", "amber"),
    queued: entry("队列中", "In coda", "amber"),
    sent: entry("已发送", "Inviata", "green"),
    delivered: entry("已送达", "Consegnata", "green"),
    skipped: entry("已跳过", "Saltata", "slate"),
    failed: entry("发送失败", "Fallita", "red"),
    error: entry("发送失败", "Errore", "red"),
  },
  order: {
    draft: entry("草稿", "Bozza", "slate"),
    checkout_created: entry("已创建结账", "Checkout creato", "amber"),
    pending_payment: entry("待付款", "Pagamento atteso", "amber"),
    paid: entry("已付款", "Pagato", "green"),
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
    cancelled: entry("已取消", "Annullato", "red"),
    refunded: entry("已退款", "Rimborsato", "red"),
    partially_refunded: entry("部分退款", "Rimborso parziale", "amber"),
    "-": entry("未记录", "Non registrato", "slate"),
  },
  paymentMethod: {
    cash: entry("现金", "Contanti", "amber"),
    bank_transfer: entry("银行转账", "Bonifico", "blue"),
    stripe: entry("Stripe 银行卡", "Carta Stripe", "violet"),
    card: entry("银行卡", "Carta", "violet"),
    "-": entry("未记录", "Non registrato", "slate"),
  },
  permission: {
    "admin:access": entry("进入后台", "Accesso admin", "slate"),
    "accounts:read": entry("查看账号", "Legge account", "blue"),
    "accounts:write": entry("维护账号", "Modifica account", "blue"),
    "staff:manage": entry("管理员工", "Gestisce staff", "violet"),
    "audit:read": entry("查看日志", "Legge audit", "slate"),
    "products:write": entry("维护商品", "Modifica prodotti", "green"),
    "inventory:write": entry("维护库存", "Modifica stock", "green"),
    "orders:write": entry("处理订单", "Gestisce ordini", "blue"),
    "payments:confirm": entry("确认付款", "Conferma pagamenti", "amber"),
    "system:read": entry("查看系统", "Legge sistema", "slate"),
  },
  priceGroup: {
    retail: entry("零售客户", "Cliente retail", "slate"),
    wholesale: entry("批发客户", "Cliente wholesale", "green"),
    b2b_pending: entry("待分配价格权限", "Price group da assegnare", "amber"),
    b2b_basic: entry("批发客户", "Cliente wholesale", "green"),
    b2b_silver: entry("批发客户", "Cliente wholesale", "green"),
    b2b_gold: entry("批发客户", "Cliente wholesale", "green"),
    distributor: entry("批发客户", "Cliente wholesale", "green"),
    admin: entry("站内管理员", "Admin sito", "violet"),
    owner: entry("总管理员", "Owner", "violet"),
    sales: entry("销售账号", "Vendite", "blue"),
    catalog: entry("商品账号", "Catalogo", "blue"),
    warehouse: entry("仓库账号", "Magazzino", "blue"),
    finance: entry("财务账号", "Finanza", "blue"),
    support: entry("客服账号", "Supporto", "blue"),
  },
  refundReason: {
    requested_by_customer: entry("客户要求", "Richiesta cliente", "slate"),
    order_cancelled: entry("订单取消", "Ordine annullato", "red"),
    duplicate: entry("重复付款", "Duplicato", "amber"),
    fraudulent: entry("欺诈风险", "Frode", "red"),
    other: entry("其他", "Altro", "slate"),
  },
  refundStatus: {
    pending: entry("退款处理中", "Rimborso in corso", "amber"),
    succeeded: entry("退款成功", "Rimborso riuscito", "green"),
    failed: entry("退款失败", "Rimborso fallito", "red"),
    cancelled: entry("退款取消", "Rimborso annullato", "red"),
    refunded: entry("已退款", "Rimborsato", "green"),
  },
  staffRole: {
    owner: entry("总管理员", "Owner", "violet"),
    manager: entry("运营管理", "Responsabile operativo", "violet"),
    sales: entry("销售 / 客户经理", "Vendite", "blue"),
    catalog: entry("商品目录", "Catalogo", "blue"),
    warehouse: entry("仓库", "Magazzino", "blue"),
    finance: entry("财务", "Finanza", "blue"),
    support: entry("客服 / 跟进", "Supporto", "blue"),
    admin: entry("站内管理员", "Admin sito", "violet"),
    retail: entry("零售客户", "Cliente retail", "slate"),
  },
  task: {
    pending: entry("待处理", "Da fare", "amber"),
    open: entry("待处理", "Da fare", "amber"),
    completed: entry("已完成", "Completato", "green"),
    cancelled: entry("已取消", "Annullato", "red"),
  },
  timelineEvent: {
    order_created: entry("订单创建", "Ordine creato", "blue"),
    checkout_created: entry("结账创建", "Checkout creato", "amber"),
    checkout_completed: entry("结账完成", "Checkout completato", "green"),
    payment_confirmed: entry("付款确认", "Pagamento confermato", "green"),
    payment_proof_saved: entry("付款凭证保存", "Prova pagamento salvata", "blue"),
    payment_proof_added: entry("付款凭证添加", "Prova pagamento aggiunta", "blue"),
    picking_started: entry("开始备货", "Picking iniziato", "blue"),
    preorder_allocated: entry("预购分配", "Preorder allocato", "green"),
    order_shipped: entry("订单发货", "Ordine spedito", "green"),
    order_picked_up: entry("订单自提", "Ordine ritirato", "green"),
    shipment_updated: entry("物流更新", "Spedizione aggiornata", "blue"),
    order_completed: entry("订单完成", "Ordine completato", "green"),
    reservation_extended: entry("锁库延期", "Prenotazione estesa", "amber"),
    reservation_released: entry("锁库释放", "Prenotazione liberata", "red"),
    order_cancelled: entry("订单取消", "Ordine annullato", "red"),
    refund_recorded: entry("退款记录", "Rimborso registrato", "red"),
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
    customerType: { zh: "客户类型", it: "Tipo cliente" },
    nextFollowUpAt: { zh: "下次跟进", it: "Prossimo follow-up" },
    priceGroup: { zh: "客户类型", it: "Tipo cliente" },
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
