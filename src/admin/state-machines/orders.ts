import { canTransition, type StateMachineAction } from "./core";

export type AdminOrderStatus =
  | "draft"
  | "pending_payment"
  | "confirmed"
  | "processing"
  | "completed"
  | "cancelled"
  | "refunded";

export type AdminPaymentStatus =
  | "unpaid"
  | "pending_manual_review"
  | "authorized"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "failed";

export type AdminFulfillmentStatus =
  | "not_started"
  | "picking"
  | "ready_for_pickup"
  | "shipped"
  | "delivered"
  | "blocked";

export type AdminOrderAction =
  | "confirm_order"
  | "start_processing"
  | "complete_order"
  | "cancel_order"
  | "refund_order";

export type AdminPaymentAction =
  | "submit_payment_proof"
  | "confirm_cash"
  | "confirm_bank_transfer"
  | "confirm_card_payment"
  | "mark_payment_failed"
  | "refund_payment";

export type AdminFulfillmentAction =
  | "start_picking"
  | "mark_ready_for_pickup"
  | "ship_order"
  | "mark_delivered"
  | "block_fulfillment";

export type AdminOrderWorkflowSnapshot = {
  orderStatus: AdminOrderStatus;
  paymentStatus: AdminPaymentStatus;
  fulfillmentStatus: AdminFulfillmentStatus;
};

export const orderTransitions: Array<StateMachineAction<AdminOrderStatus, AdminOrderAction>> = [
  {
    action: "confirm_order",
    from: ["pending_payment", "confirmed"],
    permission: "orders:write",
    to: "confirmed",
  },
  {
    action: "start_processing",
    from: ["confirmed"],
    permission: "orders:write",
    to: "processing",
  },
  {
    action: "complete_order",
    from: ["processing"],
    permission: "orders:write",
    to: "completed",
  },
  {
    action: "cancel_order",
    from: ["draft", "pending_payment", "confirmed", "processing"],
    permission: "orders:write",
    to: "cancelled",
  },
  {
    action: "refund_order",
    from: ["confirmed", "processing", "completed"],
    permission: "finance:write",
    to: "refunded",
  },
];

export const paymentTransitions: Array<StateMachineAction<AdminPaymentStatus, AdminPaymentAction>> = [
  {
    action: "submit_payment_proof",
    from: ["unpaid", "failed"],
    to: "pending_manual_review",
  },
  {
    action: "confirm_cash",
    from: ["pending_manual_review", "unpaid"],
    permission: "finance:write",
    to: "paid",
  },
  {
    action: "confirm_bank_transfer",
    from: ["pending_manual_review", "unpaid"],
    permission: "finance:write",
    to: "paid",
  },
  {
    action: "confirm_card_payment",
    from: ["authorized", "unpaid"],
    permission: "finance:write",
    to: "paid",
  },
  {
    action: "mark_payment_failed",
    from: ["unpaid", "pending_manual_review", "authorized"],
    permission: "finance:write",
    to: "failed",
  },
  {
    action: "refund_payment",
    from: ["paid", "partially_refunded"],
    permission: "finance:write",
    to: "partially_refunded",
  },
];

export const fulfillmentTransitions: Array<StateMachineAction<AdminFulfillmentStatus, AdminFulfillmentAction>> = [
  {
    action: "start_picking",
    from: ["not_started", "blocked"],
    permission: "inventory:write",
    to: "picking",
  },
  {
    action: "mark_ready_for_pickup",
    from: ["picking"],
    permission: "inventory:write",
    to: "ready_for_pickup",
  },
  {
    action: "ship_order",
    from: ["picking", "ready_for_pickup"],
    permission: "inventory:write",
    to: "shipped",
  },
  {
    action: "mark_delivered",
    from: ["ready_for_pickup", "shipped"],
    permission: "orders:write",
    to: "delivered",
  },
  {
    action: "block_fulfillment",
    from: ["not_started", "picking", "ready_for_pickup"],
    permission: "inventory:write",
    to: "blocked",
  },
];

export function canRunOrderAction(
  snapshot: AdminOrderWorkflowSnapshot,
  action: AdminOrderAction,
) {
  if (action === "confirm_order" && snapshot.paymentStatus === "unpaid") return false;
  if (action === "complete_order" && snapshot.fulfillmentStatus !== "delivered") return false;
  return canTransition(snapshot.orderStatus, action, orderTransitions);
}

export function canRunPaymentAction(
  snapshot: AdminOrderWorkflowSnapshot,
  action: AdminPaymentAction,
) {
  if (action === "refund_payment" && snapshot.orderStatus === "cancelled") return false;
  return canTransition(snapshot.paymentStatus, action, paymentTransitions);
}

export function canRunFulfillmentAction(
  snapshot: AdminOrderWorkflowSnapshot,
  action: AdminFulfillmentAction,
) {
  if (snapshot.paymentStatus !== "paid" && action !== "block_fulfillment") return false;
  if (snapshot.orderStatus === "cancelled" || snapshot.orderStatus === "refunded") return false;
  return canTransition(snapshot.fulfillmentStatus, action, fulfillmentTransitions);
}

export function getNextPrimaryOrderAction(snapshot: AdminOrderWorkflowSnapshot) {
  if (canRunPaymentAction(snapshot, "confirm_cash")) return "confirm_cash";
  if (canRunOrderAction(snapshot, "confirm_order")) return "confirm_order";
  if (canRunFulfillmentAction(snapshot, "start_picking")) return "start_picking";
  if (canRunFulfillmentAction(snapshot, "ship_order")) return "ship_order";
  if (canRunFulfillmentAction(snapshot, "mark_delivered")) return "mark_delivered";
  if (canRunOrderAction(snapshot, "complete_order")) return "complete_order";
  return null;
}
