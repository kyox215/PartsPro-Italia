import { z } from "zod";

export const paymentMethodSchema = z.enum(["stripe", "bank_transfer"]);

export const orderSchema = z.object({
  locale: z.enum(["it", "zh"]).default("it"),
  email: z.string().email().optional().or(z.literal("")),
  name: z.string().min(1).optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  vatNumber: z.string().optional().or(z.literal("")),
  fiscalCode: z.string().optional().or(z.literal("")),
  sdi: z.string().optional().or(z.literal("")),
  pec: z.string().optional().or(z.literal("")),
  shippingAddress: z.string().optional().or(z.literal("")),
  paymentMethod: paymentMethodSchema.default("bank_transfer"),
  itemsJson: z.string().optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        sku: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .optional(),
});

export const b2bApplicationSchema = z.object({
  companyName: z.string().min(1, "companyName is required"),
  vatNumber: z.string().optional().or(z.literal("")),
  fiscalCode: z.string().optional().or(z.literal("")),
  sdi: z.string().optional().or(z.literal("")),
  pec: z.string().optional().or(z.literal("")),
  contactName: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  monthlyVolume: z.string().optional().or(z.literal("")),
  interestedCategories: z.string().optional().or(z.literal("")),
});

export const rmaSchema = z.object({
  orderNumber: z.string().min(1, "orderNumber is required"),
  sku: z.string().min(1, "sku is required"),
  quantity: z.coerce.number().int().positive(),
  issueType: z.string().min(1, "issueType is required"),
  description: z.string().optional().or(z.literal("")),
});

export const adminProductSchema = z.object({
  slug: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  category: z.string().min(1),
  qualityGrade: z.string().min(1),
  nameIt: z.string().min(1),
  nameZh: z.string().min(1),
  descriptionIt: z.string().optional().or(z.literal("")),
  descriptionZh: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  sku: z.string().min(1),
  color: z.string().optional().or(z.literal("")),
  compatibility: z.string().optional().or(z.literal("")),
  moq: z.coerce.number().int().positive(),
  retailPrice: z.coerce.number().nonnegative(),
  b2bPrice: z.coerce.number().nonnegative(),
  stockOnHand: z.coerce.number().int().nonnegative(),
  incomingQty: z.coerce.number().int().nonnegative().default(0),
});
