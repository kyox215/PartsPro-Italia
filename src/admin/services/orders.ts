import type { AdminListResponse } from "@/admin/services/contracts";
import {
  getNextPrimaryOrderAction,
  type AdminFulfillmentStatus,
  type AdminOrderStatus,
  type AdminOrderWorkflowSnapshot,
  type AdminPaymentStatus,
} from "@/admin/state-machines/orders";
import {
  adminOrderFilters,
  parseAdminOrderListQuery,
  type AdminOrderFilter,
  type AdminOrderListQuery,
} from "@/admin/schemas/orders";
import {
  fetchAdminOrderDetail,
  fetchAdminOrderRows,
  type AdminOrderRow,
} from "@/admin/repositories/orders";

export type AdminOrderNextAction =
  | "confirm_order"
  | "confirm_cash"
  | "confirm_bank_transfer"
  | "confirm_card_payment"
  | "start_processing"
  | "ship_order"
  | "complete_order"
  | "refund_order";

export type AdminOrderView = AdminOrderRow & {
  workflow: AdminOrderWorkflowSnapshot;
  nextPrimaryAction: AdminOrderNextAction | null;
};

export type AdminOrderCounts = Record<AdminOrderFilter, number> & {
  pending_cash: number;
  pending_bank_transfer: number;
  pending_card: number;
};

export type AdminOrderListResult = AdminListResponse<AdminOrderView> & {
  counts: AdminOrderCounts;
  filter: AdminOrderFilter;
  q?: string;
};

export async function listAdminOrders(
  rawQuery: Record<string, string | string[] | undefined>,
): Promise<AdminOrderListResult> {
  const query = parseAdminOrderListQuery(rawQuery);
  const orders = (await fetchAdminOrderRows()).map(toAdminOrderView);
  const counts = getOrderFilterCounts(orders);
  const filtered = filterAdminOrders(orders, query);
  const offset = (query.page - 1) * query.pageSize;

  return {
    counts,
    filter: query.filter,
    items: filtered.slice(offset, offset + query.pageSize),
    page: query.page,
    pageSize: query.pageSize,
    q: query.q,
    total: filtered.length,
  };
}

export async function getAdminOrderDetailView(orderIdOrNumber: string) {
  const order = await fetchAdminOrderDetail(orderIdOrNumber);
  return order ? toAdminOrderView(order) : null;
}

export function getAdminOrderNextActionLabel(
  action: AdminOrderNextAction | null,
  locale: "it" | "zh",
) {
  if (!action) return locale === "it" ? "Nessuna azione primaria" : "暂无主操作";

  const labels: Record<AdminOrderNextAction, Record<"it" | "zh", string>> = {
    confirm_bank_transfer: {
      it: "Conferma bonifico",
      zh: "确认转账到账",
    },
    confirm_card_payment: {
      it: "Conferma carta",
      zh: "确认银行卡付款",
    },
    confirm_cash: {
      it: "Conferma contanti",
      zh: "确认现金收款",
    },
    confirm_order: {
      it: "Conferma ordine",
      zh: "确认订单",
    },
    complete_order: {
      it: "Completa ordine",
      zh: "完成订单",
    },
    refund_order: {
      it: "Registra rimborso",
      zh: "登记退款",
    },
    ship_order: {
      it: "Inserisci spedizione",
      zh: "填写物流/发货",
    },
    start_processing: {
      it: "Avvia picking",
      zh: "开始备货",
    },
  };

  return labels[action][locale];
}

export function toAdminOrderView(order: AdminOrderRow): AdminOrderView {
  const workflow = getOrderWorkflowSnapshot(order);
  return {
    ...order,
    workflow,
    nextPrimaryAction: getOrderNextAction(order, workflow),
  };
}

function getOrderWorkflowSnapshot(order: AdminOrderRow): AdminOrderWorkflowSnapshot {
  return {
    fulfillmentStatus: normalizeFulfillmentStatus(order),
    orderStatus: normalizeOrderStatus(order.status),
    paymentStatus: normalizePaymentStatus(order.paymentStatus, order.paymentMethod),
  };
}

function normalizeOrderStatus(status: string): AdminOrderStatus {
  if (status === "draft") return "draft";
  if (status === "pending_payment") return "pending_payment";
  if (status === "processing") return "processing";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  if (status === "refunded") return "refunded";
  if (status === "shipped" || status === "paid") return "confirmed";
  return "pending_payment";
}

function normalizePaymentStatus(
  status: string | null | undefined,
  paymentMethod: string,
): AdminPaymentStatus {
  if (status === "paid") return "paid";
  if (status === "partially_refunded") return "partially_refunded";
  if (status === "refunded") return "refunded";
  if (status === "failed" || status === "cancelled") return "failed";
  if (status === "pending_card" || paymentMethod === "stripe") return "authorized";
  if (status === "pending_cash" || status === "pending_bank_transfer") {
    return "pending_manual_review";
  }
  return "unpaid";
}

function normalizeFulfillmentStatus(order: AdminOrderRow): AdminFulfillmentStatus {
  if (order.status === "completed") return "delivered";
  if (order.status === "shipped" || order.shippedAt || order.trackingNumber) return "shipped";
  if (order.status === "processing") return "picking";
  return "not_started";
}

function getOrderNextAction(
  order: AdminOrderRow,
  workflow: AdminOrderWorkflowSnapshot,
): AdminOrderNextAction | null {
  if (order.paymentStatus === "pending_cash") return "confirm_cash";
  if (order.paymentStatus === "pending_bank_transfer") return "confirm_bank_transfer";
  if (order.paymentStatus === "pending_card") return "confirm_card_payment";

  const stateMachineAction = getNextPrimaryOrderAction(workflow);
  if (stateMachineAction === "confirm_cash" && order.paymentMethod === "bank_transfer") {
    return "confirm_bank_transfer";
  }
  if (stateMachineAction === "confirm_cash" && order.paymentMethod === "stripe") {
    return "confirm_card_payment";
  }
  if (stateMachineAction === "confirm_order") return "confirm_order";
  if (stateMachineAction === "start_picking") return "start_processing";
  if (stateMachineAction === "ship_order") return "ship_order";
  if (stateMachineAction === "complete_order" || stateMachineAction === "mark_delivered") {
    return "complete_order";
  }

  if (workflow.paymentStatus === "paid" && order.status === "paid") return "start_processing";
  if (workflow.paymentStatus === "paid" && !order.trackingNumber && order.status !== "completed") {
    return "ship_order";
  }
  if (order.status === "shipped") return "complete_order";

  return null;
}

function filterAdminOrders(orders: AdminOrderView[], query: AdminOrderListQuery) {
  const search = normalizeSearch(query.q ?? "");

  return orders.filter((order) => {
    if (!matchesFilter(order, query.filter)) return false;
    if (!search) return true;

    const haystack = normalizeSearch(
      [
        order.id,
        order.orderNumber,
        order.companyName,
        order.customerName,
        order.email,
        order.paymentMethod,
        order.paymentStatus,
        order.shippingCarrier,
        order.trackingNumber,
        order.trackingUrl,
        order.shipmentNote,
        order.customerNote,
        order.status,
        order.nextPrimaryAction,
        ...order.items.flatMap((item) => [item.sku, item.name, item.nameIt, item.nameZh]),
      ]
        .filter(Boolean)
        .join(" "),
    );

    return haystack.includes(search);
  });
}

function matchesFilter(order: AdminOrderView, filter: AdminOrderFilter) {
  if (filter === "all") return true;
  if (filter === "pending_payment") return isPendingPayment(order);
  if (filter === "paid") return order.paymentStatus === "paid";
  if (filter === "processing") return order.status === "processing" || order.status === "paid";
  if (filter === "shipped") return order.status === "shipped";
  if (filter === "completed") return order.status === "completed";
  if (filter === "refunded") return order.paymentStatus === "refunded" || (order.refundTotal ?? 0) > 0;
  if (filter === "cancelled") return order.status === "cancelled";
  if (filter === "expiring") return isReservationExpiringSoon(order);
  return true;
}

function getOrderFilterCounts(orders: AdminOrderView[]): AdminOrderCounts {
  const counts = Object.fromEntries(adminOrderFilters.map((filter) => [filter, 0])) as AdminOrderCounts;
  counts.all = orders.length;
  counts.pending_cash = 0;
  counts.pending_bank_transfer = 0;
  counts.pending_card = 0;

  orders.forEach((order) => {
    adminOrderFilters.forEach((filter) => {
      if (filter !== "all" && matchesFilter(order, filter)) counts[filter] += 1;
    });
    if (order.paymentStatus === "pending_cash") counts.pending_cash += 1;
    if (order.paymentStatus === "pending_bank_transfer") counts.pending_bank_transfer += 1;
    if (order.paymentStatus === "pending_card") counts.pending_card += 1;
  });

  return counts;
}

function isPendingPayment(order: AdminOrderRow) {
  return ["pending_card", "pending_cash", "pending_bank_transfer", "pending_payment"].includes(
    order.paymentStatus ?? "",
  );
}

function isReservationExpiringSoon(order: AdminOrderRow) {
  if (!order.reservationExpiresAt || order.releasedAt || order.paymentStatus === "paid") {
    return false;
  }
  return new Date(order.reservationExpiresAt).getTime() <= Date.now() + 6 * 60 * 60 * 1000;
}

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}
