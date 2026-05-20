import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

type SupabaseClient = ReturnType<typeof getSupabaseAdminClient>;

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
    metadata,
  });
  if (error) throw new Error(error.message);
}

export async function updateRmaStatus({
  rmaId,
  status,
  actorProfileId,
}: {
  rmaId: string;
  status: string;
  actorProfileId?: string | null;
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
}

export async function updateRmaResolution({
  rmaId,
  resolutionType,
  resolutionNote,
  refundAmount,
  replacementSku,
  closeCase,
  actorProfileId,
}: {
  rmaId: string;
  resolutionType: string;
  resolutionNote?: string | null;
  refundAmount?: number | null;
  replacementSku?: string | null;
  closeCase?: boolean;
  actorProfileId?: string | null;
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

  return {
    status: nextStatus,
    resolutionType,
    refundAmount: refundAmount ?? null,
    replacementSku: replacementSku || null,
    closeCase: Boolean(closeCase),
  };
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
