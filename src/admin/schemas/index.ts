import { z } from "zod";

export const adminPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminKeywordSchema = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((value) => value || undefined);
