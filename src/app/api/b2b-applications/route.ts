import { NextResponse } from "next/server";
import { parseRequestBody } from "@/lib/request";
import { getSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { b2bApplicationSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = b2bApplicationSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid wholesale application", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const applicationId = crypto.randomUUID();

  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdminClient();
    await supabase.from("b2b_applications").insert({
      id: applicationId,
      status: "pending",
      payload: parsed.data,
      company_name: parsed.data.companyName,
      vat_number: parsed.data.vatNumber || null,
      email: parsed.data.email || null,
    });
  }

  return NextResponse.json({
    applicationId,
    status: "pending",
  });
}
