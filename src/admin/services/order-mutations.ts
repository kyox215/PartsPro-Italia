import { adminError, adminOk, type AdminMutationResponse } from "@/admin/services/contracts";
import {
  addOrderPaymentProofRecord,
  appendOrderTimelineEvent,
  confirmOrderManualPayment,
  extendOrderReservationWindow,
  isOrderV2RpcEnabled,
  issueOrderRefundRecord,
  releaseExpiredOrderReservations,
  releaseOrderReservation,
  updateOrderShipmentRecord,
  updateOrderStatus,
} from "@/admin/repositories/order-transactions";
import { uploadAdminAttachmentFile } from "@/lib/admin-attachment-storage";
import type { AuthContext } from "@/lib/auth";
import { recordAdminActivity } from "@/lib/admin-audit";
import { notifyOrderCustomer } from "@/lib/notifications";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";

type AdminOrderMutationContext = {
  request: Request;
  actor: AuthContext;
  demoMode?: boolean;
};

export type AdminOrderStatusMutationInput = {
  id: string;
  status:
    | "pending_payment"
    | "paid"
    | "processing"
    | "shipped"
    | "completed"
    | "cancelled"
    | "refunded";
  locale?: "it" | "zh";
};

export type AdminOrderPaymentMutationInput = {
  id: string;
  action: "confirm_cash" | "confirm_bank_transfer";
  locale?: "it" | "zh";
};

export type AdminOrderPaymentProofMutationInput = {
  id: string;
  paymentMethod: "stripe" | "cash" | "bank_transfer";
  paymentStatus:
    | "pending_card"
    | "pending_cash"
    | "pending_bank_transfer"
    | "paid"
    | "failed"
    | "cancelled"
    | "refunded";
  amount: number;
  providerReference?: string;
  proofUrl?: string;
  proofLabel?: string;
  note?: string;
  file?: FormDataEntryValue | null;
  locale?: "it" | "zh";
};

export type AdminOrderShipmentMutationInput = {
  id: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shipmentNote?: string;
  customerNote?: string;
  locale?: "it" | "zh";
};

export type AdminOrderRefundMutationInput = {
  id: string;
  amount: number;
  reason: "duplicate" | "fraudulent" | "requested_by_customer" | "order_cancelled" | "other";
  providerReference?: string;
  note?: string;
  locale?: "it" | "zh";
};

export type AdminOrderWorkflowMutationInput = {
  id: string;
  locale?: "it" | "zh";
};

export async function adminUpdateOrderStatus(
  input: AdminOrderStatusMutationInput,
  context: AdminOrderMutationContext,
) {
  return runAdminOrderMutation("ORDER_STATUS_UPDATE_FAILED", async () => {
    if (isDemoMutation(context)) {
      return adminOk<Record<string, unknown>>({
        demoMode: true,
        orderId: input.id,
        status: input.status,
      });
    }

    await updateOrderStatus(input.id, input.status);

    await recordAdminActivity({
      request: context.request,
      actor: context.actor,
      action: "order.status.update",
      entityType: "order",
      entityId: input.id,
      afterData: {
        status: input.status,
      },
    });

    await appendOrderTimelineEvent({
      orderId: input.id,
      eventType: "status_updated",
      title: `Status updated to ${input.status}`,
      body: "Admin manually changed the order status.",
      actorProfileId: context.actor.user?.id,
      metadata: {
        status: input.status,
      },
    });

    try {
      await notifyOrderCustomer({
        orderId: input.id,
        type: "status_updated",
        locale: input.locale,
        metadata: {
          status: input.status,
        },
      });
    } catch (notificationError) {
      console.error("Failed to notify order customer", notificationError);
    }

    return adminOk<Record<string, unknown>>({
      orderId: input.id,
      status: input.status,
    });
  });
}

export async function adminConfirmOrderPayment(
  input: AdminOrderPaymentMutationInput,
  context: AdminOrderMutationContext,
) {
  return runAdminOrderMutation("ORDER_PAYMENT_CONFIRM_FAILED", async () => {
    const expectedMethod =
      input.action === "confirm_cash" ? "cash" : "bank_transfer";

    if (isDemoMutation(context)) {
      return adminOk<Record<string, unknown>>({
        demoMode: true,
        orderId: input.id,
        paymentMethod: expectedMethod,
        paymentStatus: "paid",
      });
    }

    await confirmOrderManualPayment({
      orderId: input.id,
      expectedMethod,
      actorProfileId: context.actor.user?.id,
      locale: input.locale,
    });
    await recordAdminActivity({
      request: context.request,
      actor: context.actor,
      action:
        input.action === "confirm_cash"
          ? "order.payment.confirm_cash"
          : "order.payment.confirm_bank_transfer",
      entityType: "order",
      entityId: input.id,
      afterData: {
        paymentMethod: expectedMethod,
        paymentStatus: "paid",
      },
    });

    if (isOrderV2RpcEnabled()) {
      try {
        await notifyOrderCustomer({
          orderId: input.id,
          type: "payment_paid",
          locale: input.locale,
          metadata: {
            paymentMethod: expectedMethod,
          },
        });
      } catch (notificationError) {
        console.error("Failed to notify order customer", notificationError);
      }
    }

    return adminOk<Record<string, unknown>>({
      orderId: input.id,
      paymentMethod: expectedMethod,
      paymentStatus: "paid",
    });
  });
}

export async function adminAddOrderPaymentProof(
  input: AdminOrderPaymentProofMutationInput,
  context: AdminOrderMutationContext,
) {
  return runAdminOrderMutation("ORDER_PAYMENT_PROOF_FAILED", async () => {
    if (isDemoMutation(context)) {
      return adminOk<Record<string, unknown>>({
        amount: input.amount,
        demoMode: true,
        orderId: input.id,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentStatus,
      });
    }

    const uploaded = await uploadAdminAttachmentFile({
      file: input.file ?? null,
      scope: "order-payment-proofs",
      entityId: input.id,
    });
    const result = await addOrderPaymentProofRecord({
      orderId: input.id,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentStatus,
      amount: input.amount,
      providerReference: input.providerReference || null,
      proofUrl: uploaded?.reference ?? (input.proofUrl || null),
      proofLabel: input.proofLabel || uploaded?.label || null,
      note: input.note || null,
      actorProfileId: context.actor.user?.id,
      locale: input.locale,
    });

    await recordAdminActivity({
      request: context.request,
      actor: context.actor,
      action: "order.payment.proof.add",
      entityType: "order",
      entityId: input.id,
      afterData: result,
    });

    if (isOrderV2RpcEnabled()) {
      try {
        await notifyOrderCustomer({
          orderId: input.id,
          type: "payment_proof_added",
          locale: input.locale,
          metadata: {
            amount: input.amount,
            paymentMethod: input.paymentMethod,
            paymentStatus: input.paymentStatus,
            proofLabel: input.proofLabel || uploaded?.label || null,
            proofUrl: uploaded?.reference ?? (input.proofUrl || null),
            providerReference: input.providerReference || null,
          },
        });
      } catch (notificationError) {
        console.error("Failed to notify order customer", notificationError);
      }
    }

    return adminOk<Record<string, unknown>>({
      orderId: input.id,
      paymentProof: result,
    });
  });
}

export async function adminUpdateOrderShipment(
  input: AdminOrderShipmentMutationInput,
  context: AdminOrderMutationContext,
) {
  return runAdminOrderMutation("ORDER_SHIPMENT_UPDATE_FAILED", async () => {
    if (isDemoMutation(context)) {
      return adminOk<Record<string, unknown>>({
        demoMode: true,
        orderId: input.id,
      });
    }

    const result = await updateOrderShipmentRecord({
      orderId: input.id,
      shippingCarrier: input.shippingCarrier || null,
      trackingNumber: input.trackingNumber || null,
      trackingUrl: input.trackingUrl || null,
      shipmentNote: input.shipmentNote || null,
      customerNote: input.customerNote || null,
      actorProfileId: context.actor.user?.id,
      locale: input.locale,
    });

    await recordAdminActivity({
      request: context.request,
      actor: context.actor,
      action: "order.shipment.update",
      entityType: "order",
      entityId: input.id,
      afterData: result,
    });

    if (isOrderV2RpcEnabled()) {
      try {
        await notifyOrderCustomer({
          orderId: input.id,
          type: "shipment_updated",
          locale: input.locale,
          metadata: {
            shippingCarrier: input.shippingCarrier || null,
            trackingNumber: input.trackingNumber || null,
            trackingUrl: input.trackingUrl || null,
          },
        });
      } catch (notificationError) {
        console.error("Failed to notify order customer", notificationError);
      }
    }

    return adminOk<Record<string, unknown>>({
      orderId: input.id,
      shipment: result,
    });
  });
}

export async function adminRefundOrder(
  input: AdminOrderRefundMutationInput,
  context: AdminOrderMutationContext,
) {
  return runAdminOrderMutation("ORDER_REFUND_FAILED", async () => {
    if (isDemoMutation(context)) {
      return adminOk<Record<string, unknown>>({
        amount: input.amount,
        demoMode: true,
        orderId: input.id,
        reason: input.reason,
      });
    }

    const result = await issueOrderRefundRecord({
      orderId: input.id,
      amount: input.amount,
      reason: input.reason,
      providerReference: input.providerReference || null,
      note: input.note || null,
      actorProfileId: context.actor.user?.id,
      locale: input.locale,
    });

    await recordAdminActivity({
      request: context.request,
      actor: context.actor,
      action: "order.refund.issue",
      entityType: "order",
      entityId: input.id,
      afterData: result,
    });

    return adminOk<Record<string, unknown>>({
      orderId: input.id,
      refund: result,
    });
  });
}

export async function adminExtendOrderReservation(
  input: AdminOrderWorkflowMutationInput,
  context: AdminOrderMutationContext,
) {
  return runAdminOrderMutation("ORDER_RESERVATION_EXTEND_FAILED", async () => {
    if (isDemoMutation(context)) {
      return adminOk<Record<string, unknown>>({
        demoMode: true,
        extendedHours: 24,
        orderId: input.id,
      });
    }

    const result = await extendOrderReservationWindow(input.id, context.actor.user?.id);
    await recordAdminActivity({
      request: context.request,
      actor: context.actor,
      action: "order.extend_reservation",
      entityType: "order",
      entityId: input.id,
      afterData: {
        extendedHours: 24,
        ...result,
      },
    });

    return adminOk<Record<string, unknown>>({
      orderId: input.id,
      ...result,
    });
  });
}

export async function adminReleaseOrderReservations(
  input: AdminOrderWorkflowMutationInput,
  context: AdminOrderMutationContext,
) {
  return runAdminOrderMutation("ORDER_RESERVATION_RELEASE_FAILED", async () => {
    if (isDemoMutation(context)) {
      return adminOk<Record<string, unknown>>({
        demoMode: true,
        orderId: input.id,
        paymentStatus: "cancelled",
        status: "cancelled",
      });
    }

    const result = await releaseOrderReservation({
      orderId: input.id,
      paymentStatus: "cancelled",
      status: "cancelled",
      note: "Order cancelled by admin",
      actorProfileId: context.actor.user?.id,
    });
    await recordAdminActivity({
      request: context.request,
      actor: context.actor,
      action: "order.release",
      entityType: "order",
      entityId: input.id,
      afterData: {
        status: "cancelled",
        paymentStatus: "cancelled",
        note: "Order cancelled by admin",
        result,
      },
    });

    return adminOk<Record<string, unknown>>({
      orderId: input.id,
      result,
    });
  });
}

export async function adminReleaseExpiredOrderReservations() {
  return runAdminOrderMutation("ORDER_EXPIRED_RESERVATIONS_RELEASE_FAILED", async () => {
    const result = await releaseExpiredOrderReservations();
    return adminOk<Record<string, unknown>>({
      result,
    });
  });
}

async function runAdminOrderMutation(
  code: string,
  operation: () => Promise<AdminMutationResponse<Record<string, unknown>>>,
) {
  try {
    return await operation();
  } catch (error) {
    return adminError<Record<string, unknown>>({
      code,
      message: getErrorMessage(error, "Order update failed"),
    });
  }
}

function isDemoMutation(context: AdminOrderMutationContext) {
  return context.demoMode || !hasSupabaseAdminConfig();
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
