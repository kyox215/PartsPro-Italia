import { z } from "zod";

export const checkoutCartSchema = z.object({
  locale: z.enum(["it", "zh"]).default("it"),
  items: z
    .array(
      z.object({
        sku: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .default([]),
});

export const cartQuoteSchema = checkoutCartSchema;

export type CheckoutCartInput = z.infer<typeof checkoutCartSchema>;
