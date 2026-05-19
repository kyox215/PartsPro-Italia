import { NextResponse } from "next/server";
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

  if (parsed.data.priceGroup) {
    const { data, error: loadError } = await supabase
      .from("b2b_applications")
      .select("payload")
      .eq("id", parsed.data.id)
      .maybeSingle();

    if (loadError) {
      backUrl.searchParams.set("error", loadError.message);
      return NextResponse.redirect(backUrl, 303);
    }

    const currentPayload = asRecord(data?.payload);
    const currentReview = asRecord(currentPayload.review);
    updatePayload.payload = {
      ...currentPayload,
      review: {
        ...currentReview,
        priceGroup: parsed.data.priceGroup,
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

  backUrl.searchParams.set("saved", "1");
  return NextResponse.redirect(backUrl, 303);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
