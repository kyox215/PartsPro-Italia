import {
  getAdminOrderById,
  getAdminOrderRows,
  type AdminOrderRow,
} from "@/lib/admin-operations";

export type { AdminOrderRow };

export async function fetchAdminOrderRows() {
  return getAdminOrderRows();
}

export async function fetchAdminOrderDetail(orderIdOrNumber: string) {
  return getAdminOrderById(orderIdOrNumber);
}
