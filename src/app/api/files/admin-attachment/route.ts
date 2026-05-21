import { NextResponse } from "next/server";
import {
  adminAttachmentBucket,
  getStoragePathFromReference,
} from "@/lib/admin-attachment-storage";
import { getAuthContext } from "@/lib/auth";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawPath = url.searchParams.get("path") ?? "";
  const path = getStoragePathFromReference(rawPath) ?? rawPath;

  if (!path || path.includes("..")) {
    return NextResponse.json({ error: "Invalid attachment path" }, { status: 400 });
  }

  if (!hasSupabaseAdminConfig()) {
    return NextResponse.json({ error: "Storage is not configured" }, { status: 503 });
  }

  const auth = await getAuthContext();
  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const canAccess = auth.isAdmin || (await canUserAccessAttachment(path, auth.user.id));
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await getSupabaseAdminClient()
    .storage
    .from(adminAttachmentBucket)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to create signed URL" },
      { status: 404 },
    );
  }

  return NextResponse.redirect(data.signedUrl, 302);
}

async function canUserAccessAttachment(path: string, userId: string): Promise<boolean> {
  const orderId = getEntityId(path, "order-payment-proofs");
  if (orderId) return userOwnsOrder(orderId, userId);

  return false;
}

function getEntityId(path: string, scope: "order-payment-proofs") {
  const prefix = `${scope}/`;
  if (!path.startsWith(prefix)) return null;
  const [, entityId] = path.split("/");
  return entityId || null;
}

async function userOwnsOrder(orderId: string, userId: string) {
  const { data, error } = await getSupabaseAdminClient()
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("profile_id", userId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}
