import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createAccountRma } from "@/lib/account-workflow";
import { parseRequestBody } from "@/lib/request";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
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

  const auth = await getAuthContext();

  if (auth.configured && !auth.user) {
    if (wantsRedirect(request)) {
      return NextResponse.redirect(
        new URL(`/${parsed.data.locale}/login?error=login-required`, request.url),
        303,
      );
    }

    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  if (!hasSupabaseAdminConfig()) {
    const demoRmaId = crypto.randomUUID();
    if (wantsRedirect(request)) {
      const accountUrl = new URL(`/${parsed.data.locale}/account`, request.url);
      accountUrl.searchParams.set("rma", demoRmaId);
      accountUrl.searchParams.set("status", "submitted");
      return NextResponse.redirect(accountUrl, 303);
    }

    return NextResponse.json({
      rmaId: demoRmaId,
      rmaNumber: `RMA-DEMO-${demoRmaId.slice(0, 6).toUpperCase()}`,
      status: "submitted",
    });
  }

  if (!auth.user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  let result: { rmaId: string; rmaNumber: string };
  try {
    result = await createAccountRma({
      orderId: parsed.data.orderNumber,
      sku: parsed.data.sku,
      quantity: parsed.data.quantity,
      issueType: parsed.data.issueType,
      description: parsed.data.description,
      user: auth.user,
    });
  } catch (error) {
    if (wantsRedirect(request)) {
      const rmaUrl = new URL(`/${parsed.data.locale}/rma`, request.url);
      rmaUrl.searchParams.set(
        "error",
        error instanceof Error ? error.message : "rma_failed",
      );
      return NextResponse.redirect(rmaUrl, 303);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "RMA failed" },
      { status: 400 },
    );
  }

  if (wantsRedirect(request)) {
    const accountUrl = new URL(
      `/${parsed.data.locale}/account/rma/${result.rmaId}`,
      request.url,
    );
    accountUrl.searchParams.set("saved", "created");
    return NextResponse.redirect(accountUrl, 303);
  }

  return NextResponse.json({
    rmaId: result.rmaId,
    rmaNumber: result.rmaNumber,
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
