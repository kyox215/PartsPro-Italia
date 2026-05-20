import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createAccountRma } from "@/lib/account-workflow";
import { parseRequestBody } from "@/lib/request";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { accountRmaCreateSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = accountRmaCreateSchema.safeParse(rawBody);
  const locale = parsed.success ? parsed.data.locale : String(rawBody.locale ?? "it");
  const orderId = parsed.success ? parsed.data.orderId : String(rawBody.orderId ?? "");
  const redirectUrl = new URL(
    orderId ? `/${locale}/account/orders/${encodeURIComponent(orderId)}` : `/${locale}/account/rma`,
    request.url,
  );

  if (!parsed.success) {
    redirectUrl.searchParams.set("error", "invalid_payload");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const auth = await getAuthContext();
  if (!auth.user) {
    redirectUrl.searchParams.set("error", "login_required");
    return NextResponse.redirect(redirectUrl, 303);
  }
  if (!hasSupabaseAdminConfig()) {
    redirectUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(redirectUrl, 303);
  }

  try {
    const result = await createAccountRma({
      orderId: parsed.data.orderId,
      sku: parsed.data.sku,
      quantity: parsed.data.quantity,
      issueType: parsed.data.issueType,
      description: parsed.data.description,
      user: auth.user,
    });
    const rmaUrl = new URL(`/${locale}/account/rma/${result.rmaId}`, request.url);
    rmaUrl.searchParams.set("saved", "created");
    return NextResponse.redirect(rmaUrl, 303);
  } catch (error) {
    redirectUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "rma_create_failed",
    );
    return NextResponse.redirect(redirectUrl, 303);
  }
}
