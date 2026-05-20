import { NextResponse } from "next/server";
import { saveAccountCompany } from "@/lib/account-company";
import { getAuthContext } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import { accountCompanySchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const locale = rawBody.locale === "zh" ? "zh" : "it";
  const backUrl = new URL(`/${locale}/account/company`, request.url);
  const parsed = accountCompanySchema.safeParse(rawBody);

  if (!parsed.success) {
    backUrl.searchParams.set(
      "error",
      parsed.error.issues.map((issue) => issue.message).join(", "),
    );
    return NextResponse.redirect(backUrl, 303);
  }

  const auth = await getAuthContext();

  if (auth.configured && !auth.user) {
    return NextResponse.redirect(
      new URL(`/${parsed.data.locale}/login?error=login-required`, request.url),
      303,
    );
  }

  const result = await saveAccountCompany(auth, parsed.data);

  if (!result.ok) {
    backUrl.searchParams.set("error", result.error ?? "save_failed");
    return NextResponse.redirect(backUrl, 303);
  }

  backUrl.searchParams.set(
    "saved",
    result.demoMode ? "demo" : parsed.data.intent === "submitB2B" ? "b2b" : "1",
  );
  return NextResponse.redirect(backUrl, 303);
}
