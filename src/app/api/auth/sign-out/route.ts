import { NextResponse } from "next/server";
import {
  getSupabaseServerClient,
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const locale = String(formData?.get("locale") ?? "it");

  if (hasSupabasePublicConfig()) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL(`/${locale}/login`, request.url), 303);
}
