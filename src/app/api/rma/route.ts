import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import { generateRmaNumber, recordRmaEvent } from "@/lib/rma-workflow";
import { getSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { rmaSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = rmaSchema.safeParse(rawBody);
  const locale = String(rawBody.locale ?? "it");

  if (!parsed.success) {
    if (wantsRedirect(request)) {
      const rmaUrl = new URL(`/${locale}/rma`, request.url);
      rmaUrl.searchParams.set("error", "invalid_payload");
      return NextResponse.redirect(rmaUrl, 303);
    }

    return NextResponse.json(
      { error: "Invalid RMA request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const rmaId = crypto.randomUUID();
  const rmaNumber = generateRmaNumber(rmaId);
  const auth = await getAuthContext();

  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("rmas").insert({
      id: rmaId,
      rma_number: rmaNumber,
      profile_id: auth.user?.id ?? null,
      status: "submitted",
      order_number: parsed.data.orderNumber,
      sku: parsed.data.sku,
      quantity: parsed.data.quantity,
      issue_type: parsed.data.issueType,
      description: parsed.data.description || null,
    });

    if (error) {
      if (wantsRedirect(request)) {
        const rmaUrl = new URL(`/${parsed.data.locale}/rma`, request.url);
        rmaUrl.searchParams.set("error", error.message);
        return NextResponse.redirect(rmaUrl, 303);
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      await recordRmaEvent({
        supabase,
        rmaId,
        eventType: "rma_submitted",
        title: "RMA submitted",
        body: "Customer submitted a return request.",
        actorProfileId: auth.user?.id,
        metadata: {
          rmaNumber,
          sku: parsed.data.sku,
          quantity: parsed.data.quantity,
          issueType: parsed.data.issueType,
        },
      });
    } catch (eventError) {
      console.error("Failed to record RMA submission event", eventError);
    }
  }

  if (wantsRedirect(request)) {
    const accountUrl = new URL(`/${parsed.data.locale}/account`, request.url);
    accountUrl.searchParams.set("rma", rmaId);
    accountUrl.searchParams.set("status", "submitted");
    return NextResponse.redirect(accountUrl, 303);
  }

  return NextResponse.json({
    rmaId,
    rmaNumber,
    status: "submitted",
  });
}

function wantsRedirect(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const accept = request.headers.get("accept") ?? "";
  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    accept.includes("text/html")
  );
}
