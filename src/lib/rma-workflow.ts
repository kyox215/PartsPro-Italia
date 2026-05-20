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
