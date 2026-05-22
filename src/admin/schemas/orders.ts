import { z } from "zod";
import { adminPaginationSchema } from "@/admin/schemas";

export const adminOrderFilters = [
  "all",
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "completed",
  "refunded",
  "cancelled",
  "expiring",
] as const;

export const adminOrderStatuses = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
] as const;

export type AdminOrderFilter = (typeof adminOrderFilters)[number];
export type AdminLegacyOrderStatus = (typeof adminOrderStatuses)[number];

export const adminOrderListQuerySchema = adminPaginationSchema.extend({
  filter: z.enum(adminOrderFilters).catch("all"),
  q: z.string().trim().max(160).optional().catch(undefined),
});

export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;

export function parseAdminOrderListQuery(input: Record<string, string | string[] | undefined>) {
  const firstValue = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

  return adminOrderListQuerySchema.parse({
    filter: firstValue(input.filter) || "all",
    page: firstValue(input.page) || 1,
    pageSize: firstValue(input.pageSize) || 20,
    q: firstValue(input.q) || undefined,
  });
}
