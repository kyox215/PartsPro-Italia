import { getSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabase/admin";

type SupabaseClient = ReturnType<typeof getSupabaseAdminClient>;

export type NotificationLocale = "it" | "zh";

type NotificationInput = {
  profileId?: string | null;
  orderId?: string | null;
  rmaId?: string | null;
  recipientEmail?: string | null;
  locale?: string | null;
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
};

type OrderNotificationType =
  | "payment_paid"
  | "payment_proof_added"
  | "refund_recorded"
  | "shipment_updated"
  | "status_updated";

type RmaNotificationType =
  | "rma_status_updated"
  | "rma_resolution_updated"
  | "rma_attachment_added";

export async function notifyOrderCustomer({
  orderId,
  type,
  locale,
  metadata = {},
}: {
  orderId: string;
  type: OrderNotificationType;
  locale?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!hasSupabaseAdminConfig()) return { status: "skipped", reason: "supabase_missing" };

  const supabase = getSupabaseAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, profile_id, email, customer_name, status, payment_status, fulfillment_status, total, currency, shipping_carrier, tracking_number, tracking_url, customer_note",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!order) return { status: "skipped", reason: "order_missing" };

  const template = buildOrderNotification({
    type,
    locale: normalizeLocale(locale),
    order: {
      id: order.id,
      status: order.status,
      paymentStatus: order.payment_status,
      fulfillmentStatus: order.fulfillment_status,
      total: Number(order.total ?? 0),
      currency: order.currency ?? "EUR",
      shippingCarrier: order.shipping_carrier,
      trackingNumber: order.tracking_number,
      trackingUrl: order.tracking_url,
      customerNote: order.customer_note,
    },
    metadata,
  });

  return createAndMaybeSendNotification({
    supabase,
    profileId: order.profile_id,
    orderId: order.id,
    recipientEmail: order.email,
    locale,
    subject: template.subject,
    body: template.body,
    metadata: {
      notificationType: type,
      ...metadata,
    },
  });
}

export async function notifyRmaCustomer({
  rmaId,
  type,
  locale,
  metadata = {},
}: {
  rmaId: string;
  type: RmaNotificationType;
  locale?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!hasSupabaseAdminConfig()) return { status: "skipped", reason: "supabase_missing" };

  const supabase = getSupabaseAdminClient();
  const { data: rma, error } = await supabase
    .from("rmas")
    .select(
      "id, rma_number, profile_id, order_id, status, order_number, sku, resolution_type, refund_amount, replacement_sku, resolution_note",
    )
    .eq("id", rmaId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!rma) return { status: "skipped", reason: "rma_missing" };

  const recipientEmail = await resolveRmaRecipientEmail(supabase, {
    orderId: rma.order_id,
    profileId: rma.profile_id,
  });
  const template = buildRmaNotification({
    type,
    locale: normalizeLocale(locale),
    rma: {
      id: rma.id,
      rmaNumber: rma.rma_number,
      status: rma.status,
      orderNumber: rma.order_number,
      sku: rma.sku,
      resolutionType: rma.resolution_type,
      refundAmount:
        rma.refund_amount === null || rma.refund_amount === undefined
          ? null
          : Number(rma.refund_amount),
      replacementSku: rma.replacement_sku,
      resolutionNote: rma.resolution_note,
    },
  });

  return createAndMaybeSendNotification({
    supabase,
    profileId: rma.profile_id,
    rmaId: rma.id,
    recipientEmail,
    locale,
    subject: template.subject,
    body: template.body,
    metadata: {
      notificationType: type,
      ...metadata,
    },
  });
}

async function createAndMaybeSendNotification({
  supabase,
  profileId,
  orderId,
  rmaId,
  recipientEmail,
  locale,
  subject,
  body,
  metadata = {},
}: NotificationInput & { supabase: SupabaseClient }) {
  const cleanEmail = recipientEmail?.trim().toLowerCase();
  if (!cleanEmail) {
    return { status: "skipped", reason: "missing_recipient" };
  }

  const hasEmailConfig = Boolean(process.env.RESEND_API_KEY && getEmailFrom());
  const initialStatus = hasEmailConfig ? "pending" : "skipped";
  const initialError = hasEmailConfig ? null : "RESEND_API_KEY or EMAIL_FROM not configured";
  const { data, error } = await supabase
    .from("notification_events")
    .insert({
      profile_id: profileId ?? null,
      order_id: orderId ?? null,
      rma_id: rmaId ?? null,
      channel: "email",
      locale: normalizeLocale(locale),
      recipient_email: cleanEmail,
      subject,
      body,
      status: initialStatus,
      provider: "resend",
      error_message: initialError,
      metadata,
    })
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!hasEmailConfig || !data) {
    return { id: data?.id ?? null, status: initialStatus };
  }

  try {
    const providerMessageId = await sendResendEmail({
      to: cleanEmail,
      subject,
      body,
    });
    const { error: updateError } = await supabase
      .from("notification_events")
      .update({
        status: "sent",
        provider_message_id: providerMessageId,
        sent_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", data.id);

    if (updateError) throw new Error(updateError.message);
    return { id: data.id, status: "sent", providerMessageId };
  } catch (sendError) {
    const message =
      sendError instanceof Error ? sendError.message : "Email delivery failed";
    await supabase
      .from("notification_events")
      .update({
        status: "failed",
        error_message: message,
      })
      .eq("id", data.id);
    return { id: data.id, status: "failed", error: message };
  }
}

async function resolveRmaRecipientEmail(
  supabase: SupabaseClient,
  {
    orderId,
    profileId,
  }: {
    orderId?: string | null;
    profileId?: string | null;
  },
) {
  if (orderId) {
    const { data } = await supabase
      .from("orders")
      .select("email")
      .eq("id", orderId)
      .maybeSingle();
    if (data?.email) return data.email as string;
  }

  if (profileId) {
    const { data } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", profileId)
      .maybeSingle();
    if (data?.email) return data.email as string;
  }

  return null;
}

async function sendResendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to,
      subject,
      text: body,
      html: toHtmlEmail(body),
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
    error?: string | { message?: string };
  };

  if (!response.ok) {
    const errorMessage =
      typeof payload.error === "string"
        ? payload.error
        : payload.error?.message || payload.message || "Resend email failed";
    throw new Error(errorMessage);
  }

  return payload.id ?? null;
}

function buildOrderNotification({
  type,
  locale,
  order,
  metadata = {},
}: {
  type: OrderNotificationType;
  locale: NotificationLocale;
  order: {
    id: string;
    status?: string | null;
    paymentStatus?: string | null;
    fulfillmentStatus?: string | null;
    total: number;
    currency: string;
    shippingCarrier?: string | null;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    customerNote?: string | null;
  };
  metadata?: Record<string, unknown>;
}) {
  const url = `${getSiteUrl()}/${locale}/account/orders/${order.id}`;
  const refundAmount =
    typeof metadata.refundAmount === "number" ? metadata.refundAmount : null;
  const refundCurrency =
    typeof metadata.currency === "string" ? metadata.currency : order.currency;

  if (locale === "zh") {
    if (type === "payment_paid") {
      return {
        subject: `PartsPro 订单已确认收款 ${shortId(order.id)}`,
        body: `您的订单已确认收款。\n\n订单：${order.id}\n金额：${order.total.toFixed(2)} ${order.currency}\n\n查看订单：${url}`,
      };
    }
    if (type === "shipment_updated") {
      return {
        subject: `PartsPro 订单物流已更新 ${shortId(order.id)}`,
        body: `您的订单物流信息已更新。\n\n物流公司：${order.shippingCarrier || "-"}\n物流单号：${order.trackingNumber || "-"}\n跟踪链接：${order.trackingUrl || "-"}\n${order.customerNote ? `\n备注：${order.customerNote}\n` : ""}\n查看订单：${url}`,
      };
    }
    if (type === "payment_proof_added") {
      return {
        subject: `PartsPro 订单付款记录已更新 ${shortId(order.id)}`,
        body: `您的订单付款记录已更新。\n\n订单：${order.id}\n付款状态：${order.paymentStatus || "-"}\n\n查看订单：${url}`,
      };
    }
    if (type === "refund_recorded") {
      return {
        subject: `PartsPro 订单退款已更新 ${shortId(order.id)}`,
        body: `您的订单退款记录已更新。\n\n订单：${order.id}\n退款金额：${refundAmount === null ? "-" : `${refundAmount.toFixed(2)} ${refundCurrency}`}\n付款状态：${order.paymentStatus || "-"}\n\n查看订单：${url}`,
      };
    }
    return {
      subject: `PartsPro 订单状态已更新 ${shortId(order.id)}`,
      body: `您的订单状态已更新。\n\n订单状态：${order.status || "-"}\n履约状态：${order.fulfillmentStatus || "-"}\n\n查看订单：${url}`,
    };
  }

  if (type === "payment_paid") {
    return {
      subject: `PartsPro pagamento confermato ${shortId(order.id)}`,
      body: `Abbiamo confermato il pagamento del tuo ordine.\n\nOrdine: ${order.id}\nTotale: ${order.total.toFixed(2)} ${order.currency}\n\nApri ordine: ${url}`,
    };
  }
  if (type === "shipment_updated") {
    return {
      subject: `PartsPro tracking aggiornato ${shortId(order.id)}`,
      body: `Il tracking del tuo ordine e stato aggiornato.\n\nCorriere: ${order.shippingCarrier || "-"}\nTracking: ${order.trackingNumber || "-"}\nLink: ${order.trackingUrl || "-"}\n${order.customerNote ? `\nNota: ${order.customerNote}\n` : ""}\nApri ordine: ${url}`,
    };
  }
  if (type === "payment_proof_added") {
    return {
      subject: `PartsPro registro pagamento aggiornato ${shortId(order.id)}`,
      body: `Il registro pagamento del tuo ordine e stato aggiornato.\n\nOrdine: ${order.id}\nStato pagamento: ${order.paymentStatus || "-"}\n\nApri ordine: ${url}`,
    };
  }
  if (type === "refund_recorded") {
    return {
      subject: `PartsPro rimborso aggiornato ${shortId(order.id)}`,
      body: `Il registro rimborso del tuo ordine e stato aggiornato.\n\nOrdine: ${order.id}\nImporto rimborso: ${refundAmount === null ? "-" : `${refundAmount.toFixed(2)} ${refundCurrency}`}\nStato pagamento: ${order.paymentStatus || "-"}\n\nApri ordine: ${url}`,
    };
  }
  return {
    subject: `PartsPro stato ordine aggiornato ${shortId(order.id)}`,
    body: `Lo stato del tuo ordine e stato aggiornato.\n\nStato ordine: ${order.status || "-"}\nFulfilment: ${order.fulfillmentStatus || "-"}\n\nApri ordine: ${url}`,
  };
}

function buildRmaNotification({
  type,
  locale,
  rma,
}: {
  type: RmaNotificationType;
  locale: NotificationLocale;
  rma: {
    id: string;
    rmaNumber?: string | null;
    status: string;
    orderNumber: string;
    sku: string;
    resolutionType?: string | null;
    refundAmount?: number | null;
    replacementSku?: string | null;
    resolutionNote?: string | null;
  };
}) {
  const rmaLabel = rma.rmaNumber || rma.id;
  const url = `${getSiteUrl()}/${locale}/account/rma/${rma.id}`;

  if (locale === "zh") {
    if (type === "rma_resolution_updated") {
      return {
        subject: `PartsPro 售后处理结果已更新 ${rmaLabel}`,
        body: `您的售后处理结果已更新。\n\nRMA：${rmaLabel}\n处理类型：${rma.resolutionType || "-"}\n退款金额：${rma.refundAmount === null || rma.refundAmount === undefined ? "-" : `${rma.refundAmount.toFixed(2)} EUR`}\n换货 SKU：${rma.replacementSku || "-"}\n${rma.resolutionNote ? `\n说明：${rma.resolutionNote}\n` : ""}\n查看售后：${url}`,
      };
    }
    if (type === "rma_attachment_added") {
      return {
        subject: `PartsPro 售后附件已更新 ${rmaLabel}`,
        body: `售后团队为您的 RMA 添加了新的附件或凭证。\n\nRMA：${rmaLabel}\nSKU：${rma.sku}\n\n查看售后：${url}`,
      };
    }
    return {
      subject: `PartsPro 售后状态已更新 ${rmaLabel}`,
      body: `您的售后状态已更新。\n\nRMA：${rmaLabel}\n状态：${rma.status}\nSKU：${rma.sku}\n\n查看售后：${url}`,
    };
  }

  if (type === "rma_resolution_updated") {
    return {
      subject: `PartsPro esito RMA aggiornato ${rmaLabel}`,
      body: `L'esito della tua pratica RMA e stato aggiornato.\n\nRMA: ${rmaLabel}\nEsito: ${rma.resolutionType || "-"}\nRimborso: ${rma.refundAmount === null || rma.refundAmount === undefined ? "-" : `${rma.refundAmount.toFixed(2)} EUR`}\nSKU sostitutivo: ${rma.replacementSku || "-"}\n${rma.resolutionNote ? `\nNota: ${rma.resolutionNote}\n` : ""}\nApri RMA: ${url}`,
    };
  }
  if (type === "rma_attachment_added") {
    return {
      subject: `PartsPro allegato RMA aggiornato ${rmaLabel}`,
      body: `Il team post-vendita ha aggiunto un nuovo allegato alla tua pratica RMA.\n\nRMA: ${rmaLabel}\nSKU: ${rma.sku}\n\nApri RMA: ${url}`,
    };
  }
  return {
    subject: `PartsPro stato RMA aggiornato ${rmaLabel}`,
    body: `Lo stato della tua pratica RMA e stato aggiornato.\n\nRMA: ${rmaLabel}\nStato: ${rma.status}\nSKU: ${rma.sku}\n\nApri RMA: ${url}`,
  };
}

function getEmailFrom() {
  return process.env.EMAIL_FROM || process.env.NOTIFICATION_EMAIL_FROM || null;
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://phone-parts-b2b-italy.vercel.app").replace(/\/$/, "");
}

function normalizeLocale(locale: string | null | undefined): NotificationLocale {
  return locale === "zh" ? "zh" : "it";
}

function shortId(value: string) {
  return value.slice(0, 8);
}

function toHtmlEmail(body: string) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">${body
    .split("\n")
    .map((line) => `<p style="margin:0 0 12px">${escapeHtml(line) || "&nbsp;"}</p>`)
    .join("")}</div>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
