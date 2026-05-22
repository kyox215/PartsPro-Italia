import { canTransition, type StateMachineAction } from "./core";

export type AdminRefundStatus =
  | "requested"
  | "reviewing"
  | "approved"
  | "rejected"
  | "processing"
  | "completed"
  | "failed";

export type AdminRefundAction =
  | "start_review"
  | "approve_refund"
  | "reject_refund"
  | "process_refund"
  | "complete_refund"
  | "mark_refund_failed";

export const refundTransitions: Array<StateMachineAction<AdminRefundStatus, AdminRefundAction>> = [
  {
    action: "start_review",
    from: ["requested"],
    permission: "finance:read",
    to: "reviewing",
  },
  {
    action: "approve_refund",
    from: ["requested", "reviewing"],
    permission: "finance:write",
    to: "approved",
  },
  {
    action: "reject_refund",
    from: ["requested", "reviewing"],
    permission: "finance:write",
    to: "rejected",
  },
  {
    action: "process_refund",
    from: ["approved", "failed"],
    permission: "finance:write",
    to: "processing",
  },
  {
    action: "complete_refund",
    from: ["processing"],
    permission: "finance:write",
    to: "completed",
  },
  {
    action: "mark_refund_failed",
    from: ["processing"],
    permission: "finance:write",
    to: "failed",
  },
];

export function canRunRefundAction(status: AdminRefundStatus, action: AdminRefundAction) {
  return canTransition(status, action, refundTransitions);
}
