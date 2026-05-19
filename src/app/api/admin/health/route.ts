import { NextResponse } from "next/server";
import { getMissingProductionEnv } from "@/lib/env";
import { hasStripeConfig } from "@/lib/stripe";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    integrations: {
      supabaseAdmin: hasSupabaseAdminConfig(),
      stripe: hasStripeConfig(),
    },
    missingProductionEnv: getMissingProductionEnv(),
  });
}
