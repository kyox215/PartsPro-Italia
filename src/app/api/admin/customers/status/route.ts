import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import {
  getAdminBackUrl,
  redirectOnInvalidAdminCsrf,
} from "@/lib/admin-security";
import { assertAdminPermission } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { adminCustomerStatusSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminCustomerStatusSchema.safeParse(rawBody);
  const locale = rawBody.locale === "zh" ? "zh" : "it";
  const companyId = String(rawBody.id ?? "");
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: null,
    fallbackPath: `/admin/customers/${companyId || ""}`,
    allowedPrefixes: ["/admin/customers"],
  });

  if (!parsed.success) {
    backUrl.searchParams.set("error", parsed.error.issues.map((issue) => issue.message).join(", "));
    return NextResponse.redirect(backUrl, 303);
  }

  const csrfRedirect = redirectOnInvalidAdminCsrf(request, rawBody, backUrl);
  if (csrfRedirect) return csrfRedirect;

  const admin = await assertAdminPermission("accounts:write");
  if (!admin.ok) {
    backUrl.searchParams.set("error", admin.error);
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(backUrl, 303);
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("companies")
    .update({
      status: parsed.data.status === "lead" ? "pending" : parsed.data.status,
      crm_status: parsed.data.status,
      next_follow_up_at: parsed.data.nextFollowUpAt || null,
      last_contacted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);

  if (error) {
    backUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(backUrl, 303);
  }

  await recordAdminActivity({
    request,
    actor: admin.context,
    action: "customer.status.update",
    entityType: "company",
    entityId: parsed.data.id,
    afterData: {
      status: parsed.data.status,
      nextFollowUpAt: parsed.data.nextFollowUpAt || null,
    },
  });

  backUrl.searchParams.set("saved", "status");
  return NextResponse.redirect(backUrl, 303);
}
