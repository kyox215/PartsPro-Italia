import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import {
  getAdminBackUrl,
  redirectOnInvalidAdminCsrf,
} from "@/lib/admin-security";
import { assertAdmin } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import { updateRmaStatus } from "@/lib/rma-workflow";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { adminRmaStatusSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const locale = String(rawBody.locale ?? "it");
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: rawBody.returnTo,
    fallbackPath: "/admin/rma",
    allowedPrefixes: ["/admin/rma"],
  });
  const parsed = adminRmaStatusSchema.safeParse(rawBody);

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
    await updateRmaStatus({
      rmaId: parsed.data.id,
      status: parsed.data.status,
      actorProfileId: admin.context.user?.id,
      locale: parsed.data.locale,
    });
  } catch (error) {
    backUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "RMA update failed",
    );
    return NextResponse.redirect(backUrl, 303);
  }

  await recordAdminActivity({
    request,
    actor: admin.context,
    action: "rma.status.update",
    entityType: "rma",
    entityId: parsed.data.id,
    afterData: {
      status: parsed.data.status,
    },
  });

  backUrl.searchParams.set("saved", "1");
  return NextResponse.redirect(backUrl, 303);
}
