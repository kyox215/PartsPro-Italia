import { NextResponse } from "next/server";
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
import { adminCustomerTagSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminCustomerTagSchema.safeParse(rawBody);
  const locale = rawBody.locale === "zh" ? "zh" : "it";
  const companyId = String(rawBody.companyId ?? "");
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: rawBody.returnTo,
    fallbackPath: `/admin/accounts/customers/${companyId || ""}`,
    allowedPrefixes: ["/admin/accounts/customers", "/admin/customers"],
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
  const { data: tag, error: tagError } = await supabase
    .from("customer_tags")
    .upsert(
      {
        name: parsed.data.tagName.trim(),
        color: parsed.data.color || "slate",
      },
      { onConflict: "name" },
    )
    .select("id")
    .single();

  if (tagError || !tag) {
    backUrl.searchParams.set("error", tagError?.message ?? "Tag upsert failed");
    return NextResponse.redirect(backUrl, 303);
  }

  const { error: linkError } = await supabase
    .from("customer_tag_links")
    .upsert(
      {
        company_id: parsed.data.companyId,
        tag_id: tag.id,
      },
      { onConflict: "company_id,tag_id" },
    );

  if (linkError) {
    backUrl.searchParams.set("error", linkError.message);
    return NextResponse.redirect(backUrl, 303);
  }

  backUrl.searchParams.set("saved", "tag");
  return NextResponse.redirect(backUrl, 303);
}
