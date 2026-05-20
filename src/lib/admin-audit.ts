import type { AuthContext } from "@/lib/auth";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

type AdminActivityInput = {
  request?: Request;
  actor: AuthContext;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
};

export async function recordAdminActivity({
  request,
  actor,
  action,
  entityType,
  entityId,
  beforeData,
  afterData,
}: AdminActivityInput) {
  if (!hasSupabaseAdminConfig()) {
    return;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("admin_activity_logs").insert({
      actor_profile_id: actor.user?.id ?? null,
      actor_email: actor.user?.email ?? null,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      before_data: beforeData ?? null,
      after_data: afterData ?? null,
      ip_address: getRequestIp(request),
      user_agent: request?.headers.get("user-agent") ?? null,
    });

    if (error) {
      console.error("Failed to write admin activity log", error.message);
    }
  } catch (error) {
    console.error("Failed to write admin activity log", error);
  }
}

function getRequestIp(request?: Request) {
  if (!request) return null;
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }
  return request.headers.get("x-real-ip");
}
