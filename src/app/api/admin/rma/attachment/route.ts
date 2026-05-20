import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import {
  getAdminBackUrl,
  redirectOnInvalidAdminCsrf,
} from "@/lib/admin-security";
import { assertAdmin } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import { addRmaAttachment } from "@/lib/rma-workflow";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { adminRmaAttachmentSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminRmaAttachmentSchema.safeParse(rawBody);
  const locale = String(rawBody.locale ?? "it");
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: rawBody.returnTo,
    fallbackPath: `/admin/rma/${String(rawBody.id ?? "")}`,
    allowedPrefixes: ["/admin/rma"],
  });

  if (!parsed.success) {
    backUrl.searchParams.set(
      "error",
      parsed.error.issues.map((issue) => issue.message).join(", "),
    );
    return NextResponse.redirect(backUrl, 303);
  }

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
    const result = await addRmaAttachment({
      rmaId: parsed.data.id,
      label: parsed.data.label,
      url: parsed.data.url,
      note: parsed.data.note || null,
      actorProfileId: admin.context.user?.id,
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
