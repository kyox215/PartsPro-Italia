import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import {
  getAdminBackUrl,
  redirectOnInvalidAdminCsrf,
} from "@/lib/admin-security";
import { uploadAdminAttachmentFile } from "@/lib/admin-attachment-storage";
import { assertAdmin } from "@/lib/auth";
import { addRmaAttachment } from "@/lib/rma-workflow";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { adminRmaAttachmentSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const rawBody = Object.fromEntries(formData.entries());
  const locale = String(rawBody.locale ?? "it");
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: rawBody.returnTo,
    fallbackPath: `/admin/rma/${String(rawBody.id ?? "")}`,
    allowedPrefixes: ["/admin/rma"],
  });

  const csrfRedirect = redirectOnInvalidAdminCsrf(request, rawBody, backUrl);
  if (csrfRedirect) return csrfRedirect;

  const admin = await assertAdmin();
  if (!admin.ok) {
    backUrl.searchParams.set("error", admin.error);
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(backUrl, 303);
  }

  try {
    const uploaded = await uploadAdminAttachmentFile({
      file: formData.get("file"),
      scope: "rma-attachments",
      entityId: String(rawBody.id ?? ""),
    });
    const normalizedBody = {
      ...rawBody,
      label: String(rawBody.label || uploaded?.label || ""),
      url: uploaded?.reference ?? String(rawBody.url || ""),
    };
    const parsed = adminRmaAttachmentSchema.safeParse(normalizedBody);
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map((issue) => issue.message).join(", "));
    }
    if (!isAllowedAttachmentUrl(parsed.data.url)) {
      throw new Error("Attachment URL must be http(s) or a managed storage reference.");
    }

    const result = await addRmaAttachment({
      rmaId: parsed.data.id,
      label: parsed.data.label,
      url: parsed.data.url,
      note: parsed.data.note || null,
      actorProfileId: admin.context.user?.id,
      locale: parsed.data.locale,
    });

    await recordAdminActivity({
      request,
      actor: admin.context,
      action: "rma.attachment.add",
      entityType: "rma",
      entityId: parsed.data.id,
      afterData: result,
    });
    backUrl.searchParams.set("saved", "attachment");
  } catch (error) {
    backUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "RMA attachment update failed",
    );
  }

  return NextResponse.redirect(backUrl, 303);
}

function isAllowedAttachmentUrl(value: string) {
  if (value.startsWith("storage://admin-attachments/")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
