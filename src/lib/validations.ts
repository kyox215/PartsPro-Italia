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
});

export const rmaSchema = z.object({
  locale: z.enum(["it", "zh"]).default("it"),
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
  barcodeEan13: z.string().optional().or(z.literal("")),
  costPrice: z.coerce.number().nonnegative().optional().or(z.literal("")),
  color: z.string().optional().or(z.literal("")),
  compatibility: z.string().optional().or(z.literal("")),
  moq: z.coerce.number().int().positive(),
  retailPrice: z.coerce.number().nonnegative(),
  b2bPrice: z.coerce.number().nonnegative(),
  stockOnHand: z.coerce.number().int().nonnegative(),
  incomingQty: z.coerce.number().int().nonnegative().default(0),
  attributes: z.string().optional().or(z.literal("")),
});

export const adminProductUpdateSchema = adminProductSchema.omit({
  stockOnHand: true,
  incomingQty: true,
}).extend({
  locale: z.enum(["it", "zh"]).default("it"),
  productId: z.string().min(1),
  skuId: z.string().min(1),
  returnTo: z.string().optional().or(z.literal("")),
});

export const adminProductStateSchema = z.object({
  locale: z.enum(["it", "zh"]).default("it"),
  productId: z.string().min(1),
  skuId: z.string().min(1),
  returnTo: z.string().optional().or(z.literal("")),
});

export const adminProductBulkSchema = z.object({
  locale: z.enum(["it", "zh"]).default("it"),
  action: z.enum(["publish", "archive"]),
  ids: z.string().min(1),
});

export const adminCatalogImportSchema = z.object({
  locale: z.enum(["it", "zh"]).default("it"),
  batchSize: z.coerce.number().int().positive().max(5000).default(500),
});

export const adminCatalogAttributeSchema = z.object({
  locale: z.enum(["it", "zh"]).default("it"),
  key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, "key must use lowercase letters, numbers, and underscores"),
  labelIt: z.string().min(1),
  labelZh: z.string().min(1),
  inputType: z.enum(["select", "boolean", "number", "text"]).default("select"),
  unit: z.string().optional().or(z.literal("")),
  isFilterable: z.coerce.boolean().default(true),
  options: z.string().optional().or(z.literal("")),
});

export const adminCatalogTranslationsSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("batch"),
    locale: z.enum(["it", "zh"]).default("zh"),
    limit: z.coerce.number().int().positive().max(1000).default(300),
    overwrite: z.coerce.boolean().default(false),
  }),
  z.object({
    mode: z.literal("manual"),
    locale: z.enum(["it", "zh"]).default("zh"),
    productId: z.string().min(1),
    nameZh: z.string().min(1, "nameZh is required"),
    descriptionZh: z.string().optional().or(z.literal("")),
  }),
]);

export const adminInventorySettingsSchema = z.object({
  locale: z.enum(["it", "zh"]).default("it"),
  b2bMarkup: z.coerce.number().positive(),
  retailMarkup: z.coerce.number().positive(),
  preorderLeadTimeMinDays: z.coerce.number().int().nonnegative(),
  preorderLeadTimeMaxDays: z.coerce.number().int().nonnegative(),
}).refine(
  (value) => value.preorderLeadTimeMaxDays >= value.preorderLeadTimeMinDays,
  {
    message: "max lead time must be greater than or equal to min lead time",
    path: ["preorderLeadTimeMaxDays"],
  },
);

export const adminInventoryReceiveSchema = z.object({
  locale: z.enum(["it", "zh"]).default("it"),
  itemIds: z.string().min(1),
});

export const adminInventoryAdjustSchema = z.object({
  locale: z.enum(["it", "zh"]).default("it"),
  skuId: z.string().min(1),
  adjustmentType: z.enum([
    "add_stock",
    "remove_stock",
    "set_stock",
    "add_incoming",
    "remove_incoming",
  ]),
  quantity: z.coerce.number().int().nonnegative(),
  reason: z.string().min(3, "reason is required"),
});

export const adminInventoryReorderSettingsSchema = z.object({
  locale: z.enum(["it", "zh"]).default("it"),
  inventoryId: z.string().min(1),
  reorderPoint: z.coerce.number().int().nonnegative(),
  safetyStock: z.coerce.number().int().nonnegative(),
});

export const adminOrderStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum([
    "draft",
    "checkout_created",
    "pending_payment",
    "paid",
    "processing",
    "shipped",
    "completed",
    "cancelled",
    "refunded",
  ]),
  locale: z.enum(["it", "zh"]).default("it"),
});

export const adminOrderPaymentSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["confirm_cash", "confirm_bank_transfer"]),
  locale: z.enum(["it", "zh"]).default("it"),
  returnTo: z.string().optional().or(z.literal("")),
});

export const adminOrderFulfillmentSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["start_picking", "mark_shipped", "mark_picked_up", "complete"]),
  locale: z.enum(["it", "zh"]).default("it"),
  returnTo: z.string().optional().or(z.literal("")),
});

export const adminOrderWorkflowSchema = z.object({
  id: z.string().min(1),
  locale: z.enum(["it", "zh"]).default("it"),
  returnTo: z.string().optional().or(z.literal("")),
});

export const adminOrderPaymentProofSchema = z.object({
  id: z.string().min(1),
  locale: z.enum(["it", "zh"]).default("it"),
  returnTo: z.string().optional().or(z.literal("")),
  paymentMethod: z.enum(["stripe", "cash", "bank_transfer"]),
  paymentStatus: z.enum([
    "pending_card",
    "pending_cash",
    "pending_bank_transfer",
    "paid",
    "failed",
    "cancelled",
    "refunded",
  ]),
  amount: z.coerce.number().nonnegative(),
  providerReference: z.string().optional().or(z.literal("")),
  proofUrl: z.string().url().optional().or(z.literal("")),
  proofLabel: z.string().optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
});

export const adminOrderShipmentSchema = z.object({
  id: z.string().min(1),
  locale: z.enum(["it", "zh"]).default("it"),
  returnTo: z.string().optional().or(z.literal("")),
  shippingCarrier: z.string().optional().or(z.literal("")),
  trackingNumber: z.string().optional().or(z.literal("")),
  trackingUrl: z.string().url().optional().or(z.literal("")),
  shipmentNote: z.string().optional().or(z.literal("")),
  customerNote: z.string().optional().or(z.literal("")),
});

export const adminB2BStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "approved", "rejected"]),
  priceGroup: z.string().optional().or(z.literal("")),
  locale: z.enum(["it", "zh"]).default("it"),
});

export const adminCustomerStatusSchema = z.object({
  id: z.string().min(1),
  locale: z.enum(["it", "zh"]).default("it"),
  status: z.enum(["lead", "pending", "active", "paused", "rejected", "archived"]),
  nextFollowUpAt: z.string().optional().or(z.literal("")),
});

export const adminCustomerPriceGroupSchema = z.object({
  id: z.string().min(1),
  locale: z.enum(["it", "zh"]).default("it"),
  priceGroup: z.enum(["retail", "b2b_basic", "b2b_silver", "b2b_gold", "distributor"]),
});

export const adminCustomerNoteSchema = z.object({
  companyId: z.string().min(1),
  locale: z.enum(["it", "zh"]).default("it"),
  body: z.string().min(1),
});

export const adminCustomerTaskSchema = z.object({
  companyId: z.string().min(1),
  locale: z.enum(["it", "zh"]).default("it"),
  title: z.string().min(1),
  dueAt: z.string().optional().or(z.literal("")),
});

export const adminCustomerTaskStatusSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  locale: z.enum(["it", "zh"]).default("it"),
  status: z.enum(["pending", "completed"]),
});

export const adminCustomerTagSchema = z.object({
  companyId: z.string().min(1),
  locale: z.enum(["it", "zh"]).default("it"),
  tagName: z.string().min(1),
  color: z.string().optional().or(z.literal("")),
});

export const adminRmaStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum([
    "submitted",
    "waiting_information",
    "approved_return",
    "waiting_receive",
    "testing",
    "approved",
    "rejected",
    "replacement_sent",
    "refund_processing",
    "completed",
  ]),
  locale: z.enum(["it", "zh"]).default("it"),
});

export const adminRmaResolutionSchema = z
  .object({
    id: z.string().min(1),
    locale: z.enum(["it", "zh"]).default("it"),
    returnTo: z.string().optional().or(z.literal("")),
    resolutionType: z.enum([
      "pending",
      "repair",
      "replace",
      "refund",
      "reject",
      "credit_note",
    ]),
    resolutionNote: z.string().optional().or(z.literal("")),
    refundAmount: z.coerce.number().nonnegative().optional().or(z.literal("")),
    replacementSku: z.string().optional().or(z.literal("")),
    closeCase: z.coerce.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (
      (value.resolutionType === "refund" ||
        value.resolutionType === "credit_note") &&
      (!value.refundAmount || Number(value.refundAmount) <= 0)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "refundAmount is required for refund or credit note",
        path: ["refundAmount"],
      });
    }

    if (value.resolutionType === "replace" && !value.replacementSku) {
      ctx.addIssue({
        code: "custom",
        message: "replacementSku is required for replacement",
        path: ["replacementSku"],
      });
    }
  });

export const adminRmaAttachmentSchema = z.object({
  id: z.string().min(1),
  locale: z.enum(["it", "zh"]).default("it"),
  returnTo: z.string().optional().or(z.literal("")),
  label: z.string().min(1),
  url: z.string().url(),
  note: z.string().optional().or(z.literal("")),
});
