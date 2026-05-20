import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import { redirectOnInvalidAdminCsrf } from "@/lib/admin-security";
import { assertAdmin } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { adminB2BStatusSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const locale = String(rawBody.locale ?? "it");
  const backUrl = new URL(`/${locale}/admin/b2b`, request.url);
  const parsed = adminB2BStatusSchema.safeParse(rawBody);

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

  const supabase = getSupabaseAdminClient();
  const updatePayload: Record<string, unknown> = {
    status: parsed.data.status,
    reviewed_at: new Date().toISOString(),
  };
  let applicationPayload: Record<string, unknown> = {};
  let application: {
    id: string;
    company_name: string;
    vat_number: string | null;
    email: string | null;
    payload: unknown;
  } | null = null;

  if (parsed.data.priceGroup || parsed.data.status === "approved") {
    const { data, error: loadError } = await supabase
      .from("b2b_applications")
      .select("id, company_name, vat_number, email, payload")
      .eq("id", parsed.data.id)
      .maybeSingle();

    if (loadError) {
      backUrl.searchParams.set("error", loadError.message);
      return NextResponse.redirect(backUrl, 303);
    }

    application = data ?? null;
    const currentPayload = asRecord(data?.payload);
    const currentReview = asRecord(currentPayload.review);
    applicationPayload = currentPayload;
    updatePayload.payload = {
      ...currentPayload,
      review: {
        ...currentReview,
        priceGroup: parsed.data.priceGroup || "b2b_basic",
        reviewedAt: new Date().toISOString(),
      },
    };
  }

  const { error } = await supabase
    .from("b2b_applications")
    .update(updatePayload)
    .eq("id", parsed.data.id);

  if (error) {
    backUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(backUrl, 303);
  }

  if (application && parsed.data.status === "approved") {
    try {
      await syncApprovedCustomer({
        supabase,
        application,
        payload: applicationPayload,
        priceGroup: parsed.data.priceGroup || "b2b_basic",
      });
    } catch (syncError) {
      backUrl.searchParams.set(
        "error",
        syncError instanceof Error ? syncError.message : "Customer sync failed",
      );
      return NextResponse.redirect(backUrl, 303);
    }
  }

  await recordAdminActivity({
    request,
    actor: admin.context,
    action: "b2b_application.status.update",
    entityType: "b2b_application",
    entityId: parsed.data.id,
    afterData: {
      status: parsed.data.status,
      priceGroup: parsed.data.priceGroup || null,
      syncedCustomer: Boolean(application && parsed.data.status === "approved"),
    },
  });

  backUrl.searchParams.set("saved", "1");
  return NextResponse.redirect(backUrl, 303);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function syncApprovedCustomer({
  supabase,
  application,
  payload,
  priceGroup,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  application: {
    id: string;
    company_name: string;
    vat_number: string | null;
    email: string | null;
  };
  payload: Record<string, unknown>;
  priceGroup: string;
}) {
  const email = application.email || cleanString(payload.email);
  let profile: { id: string } | null = null;
  if (email) {
    const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
    if (error) throw new Error(error.message);
    profile = data ?? null;
  }

  const { data: existingByApplication, error: appCompanyError } = await supabase
    .from("companies")
    .select("id")
    .eq("source_application_id", application.id)
    .maybeSingle();

  if (appCompanyError) throw new Error(appCompanyError.message);

  const companyPayload = {
    owner_id: profile?.id ?? null,
    company_name: application.company_name,
    contact_email: email,
    vat_number: application.vat_number,
    fiscal_code: cleanString(payload.fiscalCode),
    sdi: cleanString(payload.sdi),
    pec: cleanString(payload.pec),
    contact_name: cleanString(payload.contactName),
    phone: cleanString(payload.phone),
    whatsapp: cleanString(payload.whatsapp),
    monthly_volume: cleanString(payload.monthlyVolume),
    interested_categories: cleanString(payload.interestedCategories),
    status: profile?.id ? "active" : "approved_pending_signup",
    crm_status: profile?.id ? "active" : "approved_pending_signup",
    price_group: priceGroup,
    source_application_id: application.id,
    last_contacted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existingByApplication?.id) {
    const { error } = await supabase
      .from("companies")
      .update(companyPayload)
      .eq("id", existingByApplication.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("companies").insert(companyPayload);
    if (error) throw new Error(error.message);
  }

  if (profile?.id) {
    const { error } = await supabase
      .from("profiles")
      .update({ role: priceGroup, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (error) throw new Error(error.message);
  }
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
