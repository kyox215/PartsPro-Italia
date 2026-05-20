import type { AccountOrderRow } from "@/lib/account-activity";
import type { AccountCompany } from "@/lib/account-company";
import type { AuthContext } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";

export type AccountTone =
  | "slate"
  | "blue"
  | "emerald"
  | "amber"
  | "orange"
  | "rose";

export type AccountDisplayValue = {
  label: string;
  description: string;
  tone: AccountTone;
};

export type AccountNextAction = {
  key: string;
  label: string;
  description: string;
  tone: AccountTone;
  href?: string;
  formAction?: string;
};

const roleLabels: Record<Locale, Record<string, string>> = {
  it: {
    admin: "Account admin",
    retail: "Cliente retail",
    b2b_pending: "B2B in revisione",
    b2b_basic: "B2B Basic",
    b2b_silver: "B2B Silver",
    b2b_gold: "B2B Gold",
    distributor: "Distributore",
    demo: "Demo",
    unknown: "Cliente",
  },
  zh: {
    admin: "管理员账户",
    retail: "普通客户",
    b2b_pending: "B2B 审核中",
    b2b_basic: "B2B Basic",
    b2b_silver: "B2B Silver",
    b2b_gold: "B2B Gold",
    distributor: "分销商",
    demo: "演示账户",
    unknown: "客户",
  },
};

export function formatAccountRole(
  authOrRole: Pick<AuthContext, "role" | "isAdmin" | "configured"> | string | null,
  locale: Locale,
) {
  if (typeof authOrRole === "string" || authOrRole === null) {
    const key = authOrRole ?? "unknown";
    return roleLabels[locale][key] ?? key;
  }

  if (!authOrRole.configured) return roleLabels[locale].demo;
  if (authOrRole.isAdmin) return roleLabels[locale].admin;
  return roleLabels[locale][authOrRole.role ?? "unknown"] ?? roleLabels[locale].unknown;
}

export function formatOrderStatus(status: string | null | undefined, locale: Locale) {
  return mapStatus(status, locale, {
    draft: {
      it: ["Bozza", "Ordine non ancora confermato.", "slate"],
      zh: ["草稿", "订单尚未确认。", "slate"],
    },
    checkout_created: {
      it: ["Checkout aperto", "Completa il pagamento carta prima della scadenza.", "blue"],
      zh: ["已创建付款", "请在库存锁定过期前完成银行卡付款。", "blue"],
    },
    pending_payment: {
      it: ["In attesa di pagamento", "La merce e riservata mentre aspettiamo il pagamento.", "amber"],
      zh: ["等待付款", "库存已临时锁定，等待付款或凭证。", "amber"],
    },
    paid: {
      it: ["Pagato", "Pagamento confermato, ordine in lavorazione.", "emerald"],
      zh: ["已付款", "付款已确认，订单进入处理流程。", "emerald"],
    },
    processing: {
      it: ["In lavorazione", "Il magazzino sta preparando l'ordine.", "blue"],
      zh: ["处理中", "仓库正在处理或拣货。", "blue"],
    },
    shipped: {
      it: ["Spedito", "La spedizione e stata registrata.", "blue"],
      zh: ["已发货", "物流信息已登记。", "blue"],
    },
    completed: {
      it: ["Completato", "Ordine concluso.", "emerald"],
      zh: ["已完成", "订单已完成。", "emerald"],
    },
    cancelled: {
      it: ["Annullato", "Ordine annullato e prenotazione rilasciata.", "slate"],
      zh: ["已取消", "订单已取消，库存锁定已释放。", "slate"],
    },
    refunded: {
      it: ["Rimborsato", "Rimborso registrato sull'ordine.", "orange"],
      zh: ["已退款", "订单已登记退款。", "orange"],
    },
  });
}

export function formatPaymentMethod(method: string | null | undefined, locale: Locale) {
  const labels: Record<string, Record<Locale, string>> = {
    stripe: { it: "Carta Stripe", zh: "Stripe 银行卡" },
    cash: { it: "Contanti", zh: "现金支付" },
    bank_transfer: { it: "Bonifico bancario", zh: "银行转账" },
  };

  return labels[method ?? ""]?.[locale] ?? (method || "-");
}

export function formatPaymentStatus(status: string | null | undefined, locale: Locale) {
  return mapStatus(status, locale, {
    pending_card: {
      it: ["Carta da completare", "Pagamento carta non ancora completato.", "amber"],
      zh: ["银行卡待支付", "Stripe 付款尚未完成。", "amber"],
    },
    pending_cash: {
      it: ["Contanti da confermare", "Pagamento contanti in attesa di conferma admin.", "amber"],
      zh: ["现金待确认", "等待后台确认现金付款。", "amber"],
    },
    pending_bank_transfer: {
      it: ["Bonifico da confermare", "Carica un riferimento bonifico o attendi conferma.", "amber"],
      zh: ["转账待确认", "可提交转账参考号，等待后台确认。", "amber"],
    },
    paid: {
      it: ["Pagato", "Pagamento confermato.", "emerald"],
      zh: ["已付款", "付款已确认。", "emerald"],
    },
    failed: {
      it: ["Pagamento fallito", "Il pagamento non e andato a buon fine.", "rose"],
      zh: ["付款失败", "付款未成功。", "rose"],
    },
    cancelled: {
      it: ["Pagamento annullato", "La prenotazione non e piu attiva.", "slate"],
      zh: ["付款已取消", "库存锁定已失效或释放。", "slate"],
    },
    refunded: {
      it: ["Rimborsato", "Pagamento rimborsato.", "orange"],
      zh: ["已退款", "付款已退款。", "orange"],
    },
  });
}

export function formatFulfillmentStatus(status: string | null | undefined, locale: Locale) {
  return mapStatus(status, locale, {
    unfulfilled: {
      it: ["Da evadere", "Ordine non ancora preparato.", "slate"],
      zh: ["待履约", "订单尚未开始履约。", "slate"],
    },
    reserved: {
      it: ["Stock riservato", "La quantita disponibile e bloccata per questo ordine.", "emerald"],
      zh: ["现货已锁定", "可用现货已为此订单锁定。", "emerald"],
    },
    awaiting_preorder: {
      it: ["In attesa preorder", "Parte della merce attende arrivo fornitore.", "orange"],
      zh: ["等待预购到货", "部分商品等待供应商到货。", "orange"],
    },
    picking: {
      it: ["Picking", "Il magazzino sta preparando i prodotti.", "blue"],
      zh: ["拣货中", "仓库正在拣货。", "blue"],
    },
    allocated: {
      it: ["Preorder allocato", "La merce in arrivo e stata allocata all'ordine.", "blue"],
      zh: ["预购已分配", "到货库存已分配给此订单。", "blue"],
    },
    shipped: {
      it: ["Spedito", "Ordine spedito o ritirato.", "blue"],
      zh: ["已发货", "订单已发货或已自提。", "blue"],
    },
    fulfilled: {
      it: ["Completato", "Fulfilment completato.", "emerald"],
      zh: ["履约完成", "订单履约已完成。", "emerald"],
    },
    cancelled: {
      it: ["Annullato", "Fulfilment annullato.", "slate"],
      zh: ["履约取消", "履约已取消。", "slate"],
    },
  });
}

export function formatFulfillmentType(type: string | null | undefined, locale: Locale) {
  if (type === "preorder") return locale === "it" ? "Preorder" : "预购";
  if (type === "mixed") return locale === "it" ? "Stock + preorder" : "现货 + 预购";
  return locale === "it" ? "Stock" : "现货";
}

export function formatRmaStatus(status: string | null | undefined, locale: Locale) {
  return mapStatus(status, locale, {
    submitted: {
      it: ["Inviata", "La richiesta e stata ricevuta.", "blue"],
      zh: ["已提交", "售后申请已收到。", "blue"],
    },
    waiting_information: {
      it: ["Info richieste", "Il team aspetta dettagli o allegati.", "amber"],
      zh: ["等待补充", "售后团队等待更多说明或附件。", "amber"],
    },
    approved_return: {
      it: ["Reso approvato", "Puoi spedire il prodotto per verifica.", "emerald"],
      zh: ["批准寄回", "可按售后要求寄回检测。", "emerald"],
    },
    waiting_receive: {
      it: ["In attesa ricezione", "Il team aspetta il pacco.", "amber"],
      zh: ["等待收货", "售后团队等待收到退件。", "amber"],
    },
    testing: {
      it: ["In test", "Il prodotto e in verifica tecnica.", "blue"],
      zh: ["检测中", "售后团队正在检测。", "blue"],
    },
    approved: {
      it: ["Approvata", "La pratica e stata approvata.", "emerald"],
      zh: ["已批准", "售后申请已批准。", "emerald"],
    },
    rejected: {
      it: ["Rifiutata", "La pratica non e stata approvata.", "rose"],
      zh: ["已拒绝", "售后申请未通过。", "rose"],
    },
    replacement_sent: {
      it: ["Sostituzione inviata", "Il ricambio sostitutivo e stato registrato.", "blue"],
      zh: ["换货已发出", "换货商品已登记。", "blue"],
    },
    refund_processing: {
      it: ["Rimborso in corso", "Il rimborso e in lavorazione.", "orange"],
      zh: ["退款处理中", "退款正在处理。", "orange"],
    },
    completed: {
      it: ["Completata", "Pratica chiusa.", "emerald"],
      zh: ["已完成", "售后流程已关闭。", "emerald"],
    },
  });
}

export function formatRmaIssueType(type: string | null | undefined, locale: Locale) {
  const labels: Record<string, Record<Locale, string>> = {
    defective: { it: "Difettoso", zh: "产品故障" },
    wrong_item: { it: "Articolo errato", zh: "发错商品" },
    damaged: { it: "Danneggiato", zh: "运输/外观损坏" },
    compatibility: { it: "Compatibilita", zh: "兼容问题" },
    touch_issue: { it: "Problema touch", zh: "触控问题" },
    other: { it: "Altro", zh: "其他问题" },
  };

  return labels[type ?? ""]?.[locale] ?? (type || "-");
}

export function formatResolutionType(type: string | null | undefined, locale: Locale) {
  const labels: Record<string, Record<Locale, string>> = {
    pending: { it: "In attesa", zh: "待处理" },
    repair: { it: "Riparazione", zh: "维修" },
    replace: { it: "Sostituzione", zh: "换货" },
    refund: { it: "Rimborso", zh: "退款" },
    reject: { it: "Rifiuto", zh: "拒绝" },
    credit_note: { it: "Nota di credito", zh: "信用额度/贷项" },
  };

  return labels[type ?? ""]?.[locale] ?? (type || "-");
}

export function formatTimelineEvent(type: string | null | undefined, locale: Locale) {
  const labels: Record<string, Record<Locale, string>> = {
    order_created: { it: "Ordine creato", zh: "订单创建" },
    reservation_released: { it: "Prenotazione rilasciata", zh: "库存锁定释放" },
    payment_paid: { it: "Pagamento confermato", zh: "付款确认" },
    payment_proof_added: { it: "Prova pagamento aggiunta", zh: "付款凭证已登记" },
    payment_proof_submitted: { it: "Prova pagamento inviata", zh: "付款凭证已提交" },
    customer_message: { it: "Messaggio cliente", zh: "客户留言" },
    refund_recorded: { it: "Rimborso registrato", zh: "退款登记" },
    refund_status_updated: { it: "Stato rimborso aggiornato", zh: "退款状态更新" },
    shipment_updated: { it: "Tracking aggiornato", zh: "物流更新" },
    picking_started: { it: "Picking iniziato", zh: "开始拣货" },
    preorder_allocated: { it: "Preorder allocato", zh: "预购分配" },
    order_shipped: { it: "Ordine spedito", zh: "订单发货" },
    order_picked_up: { it: "Ordine ritirato", zh: "订单自提" },
    order_completed: { it: "Ordine completato", zh: "订单完成" },
    reservation_extended: { it: "Prenotazione estesa", zh: "库存锁定延长" },
    rma_submitted: { it: "RMA inviata", zh: "售后提交" },
    status_updated: { it: "Stato aggiornato", zh: "状态更新" },
    resolution_updated: { it: "Esito aggiornato", zh: "处理结果更新" },
    attachment_added: { it: "Allegato aggiunto", zh: "附件添加" },
    rma_customer_message: { it: "Messaggio cliente", zh: "客户补充说明" },
  };

  return labels[type ?? ""]?.[locale] ?? (type || "-");
}

export function statusBadgeClass(tone: AccountTone) {
  const classes = {
    slate: "border-slate-300 bg-slate-100 text-slate-800",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  } satisfies Record<AccountTone, string>;

  return classes[tone];
}

export function canCancelOrder(order: Pick<AccountOrderRow, "status" | "paymentStatus">) {
  return (
    order.status !== "cancelled" &&
    order.status !== "refunded" &&
    order.paymentStatus !== "paid" &&
    order.paymentStatus !== "refunded"
  );
}

export function canSubmitPaymentProof(
  order: Pick<AccountOrderRow, "paymentMethod" | "paymentStatus" | "status">,
) {
  return (
    (order.paymentMethod === "bank_transfer" || order.paymentMethod === "cash") &&
    order.status !== "cancelled" &&
    order.paymentStatus !== "paid" &&
    order.paymentStatus !== "refunded"
  );
}

export function canCreateRma(order: Pick<AccountOrderRow, "status" | "paymentStatus">) {
  return (
    order.paymentStatus === "paid" &&
    ["paid", "processing", "shipped", "completed"].includes(order.status)
  );
}

export function getAccountNextActions(order: AccountOrderRow, locale: Locale) {
  const actions: AccountNextAction[] = [];

  if (order.paymentMethod === "stripe" && order.status === "checkout_created") {
    actions.push({
      key: "continue_stripe",
      label: locale === "it" ? "Completa pagamento" : "继续银行卡付款",
      description:
        locale === "it"
          ? "Se il checkout e scaduto, crea un nuovo ordine dal carrello."
          : "如果 Stripe 链接已过期，请重新下单生成新的付款。",
      tone: "blue",
    });
  }

  if (canSubmitPaymentProof(order)) {
    actions.push({
      key: "payment_proof",
      label: locale === "it" ? "Invia prova pagamento" : "提交付款凭证",
      description:
        locale === "it"
          ? "Aggiungi riferimento bonifico o nota contanti per velocizzare la conferma."
          : "提交转账参考号或现金付款备注，方便后台确认。",
      tone: "amber",
      formAction: "/api/account/orders/payment-proof",
    });
  }

  if (canCancelOrder(order)) {
    actions.push({
      key: "cancel",
      label: locale === "it" ? "Annulla ordine" : "取消订单",
      description:
        locale === "it"
          ? "Disponibile solo prima della conferma pagamento."
          : "仅限付款确认前，取消后释放库存锁定。",
      tone: "rose",
      formAction: "/api/account/orders/cancel",
    });
  }

  if (order.trackingUrl || order.trackingNumber) {
    actions.push({
      key: "tracking",
      label: locale === "it" ? "Apri tracking" : "查看物流",
      description:
        locale === "it"
          ? "Segui il pacco con il corriere registrato."
          : "打开后台登记的物流链接或单号。",
      tone: "blue",
      href: order.trackingUrl ?? undefined,
    });
  }

  actions.push({
    key: "reorder",
    label: locale === "it" ? "Riordina" : "再次购买",
    description:
      locale === "it"
        ? "Copia gli SKU nel checkout e ricalcola prezzi e disponibilita attuali."
        : "复制此订单 SKU 到结账页，并重新校验当前价格和库存。",
    tone: "emerald",
    formAction: "/api/account/orders/reorder",
  });

  return actions;
}

export function getCompanyCompletion(company: AccountCompany | null) {
  if (!company) {
    return {
      completed: 0,
      total: 7,
      percent: 0,
      missing: [
        "companyName",
        "vatNumber",
        "billingAddress",
        "shippingAddress",
        "contactName",
        "phone",
        "interestedCategories",
      ],
    };
  }

  const fields = [
    "companyName",
    "vatNumber",
    "billingAddress",
    "shippingAddress",
    "contactName",
    "phone",
    "interestedCategories",
  ] as const;
  const missing = fields.filter((field) => !String(company[field] ?? "").trim());
  const completed = fields.length - missing.length;

  return {
    completed,
    total: fields.length,
    percent: Math.round((completed / fields.length) * 100),
    missing,
  };
}

export function formatCompanyStatus(status: string | null | undefined, locale: Locale) {
  return mapStatus(status, locale, {
    lead: {
      it: ["Lead", "Dati ricevuti, non ancora approvati.", "slate"],
      zh: ["潜在客户", "资料已记录，尚未完成审核。", "slate"],
    },
    pending: {
      it: ["In revisione", "Il team sta verificando i dati B2B.", "amber"],
      zh: ["审核中", "后台正在审核 B2B 资料。", "amber"],
    },
    active: {
      it: ["Attivo", "Account aziendale attivo.", "emerald"],
      zh: ["已激活", "公司账户已启用。", "emerald"],
    },
    approved_pending_signup: {
      it: ["Approvato, signup atteso", "Approvato ma non ancora collegato a un login.", "blue"],
      zh: ["已批准待注册", "B2B 已批准，等待账号注册或关联。", "blue"],
    },
    paused: {
      it: ["In pausa", "Account temporaneamente sospeso.", "orange"],
      zh: ["暂停", "账户暂时暂停。", "orange"],
    },
    rejected: {
      it: ["Rifiutato", "La richiesta non e stata approvata.", "rose"],
      zh: ["已拒绝", "申请未通过。", "rose"],
    },
    archived: {
      it: ["Archiviato", "Profilo archiviato.", "slate"],
      zh: ["已归档", "资料已归档。", "slate"],
    },
  });
}

function mapStatus(
  status: string | null | undefined,
  locale: Locale,
  values: Record<string, Record<Locale, [string, string, AccountTone]>>,
): AccountDisplayValue {
  const fallback = status || "-";
  const value = values[status ?? ""]?.[locale];

  if (!value) {
    return {
      label: fallback,
      description: locale === "it" ? "Stato non mappato." : "未映射状态。",
      tone: "slate",
    };
  }

  return {
    label: value[0],
    description: value[1],
    tone: value[2],
  };
}
