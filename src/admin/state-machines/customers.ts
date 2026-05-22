import { canTransition, type StateMachineAction } from "./core";

export type AdminCustomerStatus = "lead" | "active" | "wholesale" | "suspended" | "archived";

export type AdminCustomerAction =
  | "approve_wholesale"
  | "change_price_group"
  | "suspend_customer"
  | "restore_customer"
  | "archive_customer";

export const customerTransitions: Array<StateMachineAction<AdminCustomerStatus, AdminCustomerAction>> = [
  {
    action: "approve_wholesale",
    from: ["lead", "active"],
    permission: "customers:write",
    to: "wholesale",
  },
  {
    action: "change_price_group",
    from: ["active", "wholesale"],
    permission: "customers:write",
    to: "wholesale",
  },
  {
    action: "suspend_customer",
    from: ["lead", "active", "wholesale"],
    permission: "customers:write",
    to: "suspended",
  },
  {
    action: "restore_customer",
    from: ["suspended"],
    permission: "customers:write",
    to: "active",
  },
  {
    action: "archive_customer",
    from: ["lead", "active", "wholesale", "suspended"],
    permission: "customers:write",
    to: "archived",
  },
];

export function canRunCustomerAction(status: AdminCustomerStatus, action: AdminCustomerAction) {
  return canTransition(status, action, customerTransitions);
}
