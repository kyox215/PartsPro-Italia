import { z } from "zod";

export const paymentMethodSchema = z.enum(["stripe", "cash", "bank_transfer"]);

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

export const accountCompanySchema = z.object({
  locale: z.enum(["it", "zh"]).default("it"),
  companyName: z.string().min(1, "companyName is required"),
  vatNumber: z.string().optional().or(z.literal("")),
  fiscalCode: z.string().optional().or(z.literal("")),
  sdi: z.string().optional().or(z.literal("")),
  pec: z.string().email().optional().or(z.literal("")),
  billingAddress: z.string().optional().or(z.literal("")),
  shippingAddress: z.string().optional().or(z.literal("")),
  contactName: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  companyType: z.string().optional().or(z.literal("")),
  monthlyVolume: z.string().optional().or(z.literal("")),
  interestedCategories: z.string().optional().or(z.literal("")),
  intent: z.string().optional().or(z.literal("")),
});

export const accountOrderActionSchema = z.object({
  id: z.string().min(1),
  locale: z.enum(["it", "zh"]).default("it"),
  returnTo: z.string().optional().or(z.literal("")),
});

export const accountOrderPaymentProofSchema = accountOrderActionSchema.extend({
  providerReference: z.string().optional().or(z.literal("")),
  proofUrl: z.string().url().optional().or(z.literal("")),
  proofLabel: z.string().optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
});

export const accountMessageSchema = z.object({
  id: z.string().min(1),
  locale: z.enum(["it", "zh"]).default("it"),
  returnTo: z.string().optional().or(z.literal("")),
  message: z.string().min(2, "message is required"),
});

export const accountNotificationReadSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  locale: z.enum(["it", "zh"]).default("it"),
  returnTo: z.string().optional().or(z.literal("")),
});
