import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import {
  adminCustomerTaskSchema,
  adminCustomerTaskStatusSchema,
} from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const locale = rawBody.locale === "zh" ? "zh" : "it";
  const companyId = String(rawBody.companyId ?? "");
  const backUrl = new URL(`/${locale}/admin/customers/${companyId || ""}`, request.url);
  const admin = await assertAdmin();

  if (!admin.ok) {
    backUrl.searchParams.set("error", admin.error);
    return NextResponse.redirect(backUrl, 303);
  }

  if (rawBody.id) {
    const parsed = adminCustomerTaskStatusSchema.safeParse(rawBody);
    if (!parsed.success) {
      backUrl.searchParams.set("error", parsed.error.issues.map((issue) => issue.message).join(", "));
      return NextResponse.redirect(backUrl, 303);
    }
    if (!hasSupabaseAdminConfig()) {
      backUrl.searchParams.set("saved", "demo");
      return NextResponse.redirect(backUrl, 303);
    }
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("customer_tasks")
      .update({
        status: parsed.data.status,
        completed_at: parsed.data.status === "completed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id)
      .eq("company_id", parsed.data.companyId);

    if (error) {
      backUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(backUrl, 303);
    }
    backUrl.searchParams.set("saved", "task");
    return NextResponse.redirect(backUrl, 303);
  }

  const parsed = adminCustomerTaskSchema.safeParse(rawBody);
  if (!parsed.success) {
    backUrl.searchParams.set("error", parsed.error.issues.map((issue) => issue.message).join(", "));
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(backUrl, 303);
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("customer_tasks").insert({
    company_id: parsed.data.companyId,
    title: parsed.data.title,
    due_at: parsed.data.dueAt || null,
    created_by: admin.context.user?.id ?? null,
  });

  if (error) {
    backUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(backUrl, 303);
  }

  backUrl.searchParams.set("saved", "task");
  return NextResponse.redirect(backUrl, 303);
}
