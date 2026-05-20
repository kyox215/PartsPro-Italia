import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { notifyRmaCustomer } from "@/lib/notifications";

type SupabaseClient = ReturnType<typeof getSupabaseAdminClient>;

export type RmaAttachment = {
  id: string;
  label: string;
  url: string;
  note?: string | null;
  createdAt: string;
  actorProfileId?: string | null;
};

export function generateRmaNumber(rmaId: string, date = new Date()) {
  const compactDate = date.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = rmaId.replaceAll("-", "").slice(0, 6).toUpperCase();
  return `RMA-${compactDate}-${suffix}`;
}

export async function recordRmaEvent({
  supabase,
  rmaId,
  eventType,
  title,
  body,
  actorProfileId,
  metadata = {},
}: {
  supabase?: SupabaseClient;
  rmaId: string;
  eventType: string;
  title: string;
  body?: string | null;
  actorProfileId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!hasSupabaseAdminConfig()) return;
  const client = supabase ?? getSupabaseAdminClient();
  const { error } = await client.from("rma_events").insert({
    rma_id: rmaId,
    event_type: eventType,
    title,
    body: body ?? null,
    actor_profile_id: actorProfileId ?? null,
    customer_visible: true,
    metadata,
  });
  if (error) throw new Error(error.message);
}

export async function updateRmaStatus({
  rmaId,
  status,
  actorProfileId,
  locale,
}: {
  rmaId: string;
  status: string;
  actorProfileId?: string | null;
  locale?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("rmas")
    .update({
      status,
      closed_at: status === "completed" ? now : null,
      updated_at: now,
    })
    .eq("id", rmaId);

  if (error) throw new Error(error.message);

  await recordRmaEvent({
    supabase,
    rmaId,
    eventType: "status_updated",
    title: `RMA status updated to ${status}`,
    body: "Admin changed the RMA processing status.",
    actorProfileId,
    metadata: {
      status,
    },
  });

  await tryNotifyRmaCustomer({
    rmaId,
    type: "rma_status_updated",
    locale,
    metadata: {
      status,
    },
  });
}

export async function updateRmaResolution({
  rmaId,
  resolutionType,
  resolutionNote,
  refundAmount,
  replacementSku,
  closeCase,
  actorProfileId,
  locale,
}: {
  rmaId: string;
  resolutionType: string;
  resolutionNote?: string | null;
  refundAmount?: number | null;
  replacementSku?: string | null;
  closeCase?: boolean;
  actorProfileId?: string | null;
  locale?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const nextStatus = closeCase ? "completed" : getStatusForResolution(resolutionType);
  const { error } = await supabase
    .from("rmas")
    .update({
      status: nextStatus,
      resolution_type: resolutionType,
      resolution_note: resolutionNote || null,
      refund_amount:
        resolutionType === "refund" || resolutionType === "credit_note"
          ? refundAmount ?? 0
          : null,
      replacement_sku: resolutionType === "replace" ? replacementSku || null : null,
      closed_at: closeCase ? now : null,
      updated_at: now,
    })
    .eq("id", rmaId);

  if (error) throw new Error(error.message);

  await recordRmaEvent({
    supabase,
    rmaId,
    eventType: "resolution_updated",
    title: `RMA resolution set to ${resolutionType}`,
    body: resolutionNote || "Admin updated the RMA resolution.",
    actorProfileId,
    metadata: {
      resolutionType,
      refundAmount: refundAmount ?? null,
      replacementSku: replacementSku || null,
      closeCase: Boolean(closeCase),
      status: nextStatus,
    },
  });

  await tryNotifyRmaCustomer({
    rmaId,
    type: "rma_resolution_updated",
    locale,
    metadata: {
      resolutionType,
      refundAmount: refundAmount ?? null,
      replacementSku: replacementSku || null,
      closeCase: Boolean(closeCase),
      status: nextStatus,
    },
  });

  return {
    status: nextStatus,
    resolutionType,
    refundAmount: refundAmount ?? null,
    replacementSku: replacementSku || null,
    closeCase: Boolean(closeCase),
  };
}

export async function addRmaAttachment({
  rmaId,
  label,
  url,
  note,
  actorProfileId,
  locale,
}: {
  rmaId: string;
  label: string;
  url: string;
  note?: string | null;
  actorProfileId?: string | null;
  locale?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error: loadError } = await supabase
    .from("rmas")
    .select("attachments")
    .eq("id", rmaId)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!data) throw new Error("RMA not found.");

  const attachment: RmaAttachment = {
    id: crypto.randomUUID(),
    label,
    url,
    note: note || null,
    createdAt: new Date().toISOString(),
    actorProfileId: actorProfileId ?? null,
  };
  const attachments = normalizeAttachments(data.attachments);
  const { error } = await supabase
    .from("rmas")
    .update({
      attachments: [...attachments, attachment],
      updated_at: new Date().toISOString(),
    })
    .eq("id", rmaId);

  if (error) throw new Error(error.message);

  await recordRmaEvent({
    supabase,
    rmaId,
    eventType: "attachment_added",
    title: "RMA attachment added",
    body: note || label,
    actorProfileId,
    metadata: {
      attachment,
    },
  });

  await tryNotifyRmaCustomer({
    rmaId,
    type: "rma_attachment_added",
    locale,
    metadata: {
      attachmentId: attachment.id,
      label: attachment.label,
    },
  });

  return attachment;
}

function getStatusForResolution(resolutionType: string) {
  if (resolutionType === "replace") return "replacement_sent";
  if (resolutionType === "refund" || resolutionType === "credit_note") {
    return "refund_processing";
  }
  if (resolutionType === "reject") return "rejected";
  if (resolutionType === "repair") return "approved";
  return "testing";
}

function normalizeAttachments(value: unknown): RmaAttachment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      id: String(item.id ?? crypto.randomUUID()),
      label: String(item.label ?? item.name ?? "Attachment"),
      url: String(item.url ?? ""),
      note: typeof item.note === "string" ? item.note : null,
      createdAt: String(item.createdAt ?? item.created_at ?? new Date().toISOString()),
      actorProfileId:
        typeof item.actorProfileId === "string"
          ? item.actorProfileId
          : typeof item.actor_profile_id === "string"
            ? item.actor_profile_id
            : null,
    }))
    .filter((item) => item.url.length > 0);
}

async function tryNotifyRmaCustomer(
  payload: Parameters<typeof notifyRmaCustomer>[0],
) {
  try {
    await notifyRmaCustomer(payload);
  } catch (error) {
    console.error("Failed to notify RMA customer", error);
  }
}
