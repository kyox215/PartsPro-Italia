import { NextResponse } from "next/server";
import { parseRequestBody } from "@/lib/request";
import { getSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { rmaSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = rmaSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid RMA request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const rmaId = crypto.randomUUID();

  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdminClient();
    await supabase.from("rmas").insert({
      id: rmaId,
      status: "submitted",
      order_number: parsed.data.orderNumber,
      sku: parsed.data.sku,
      quantity: parsed.data.quantity,
      issue_type: parsed.data.issueType,
      description: parsed.data.description || null,
    });
  }

  return NextResponse.json({
    rmaId,
    status: "submitted",
  });
}
