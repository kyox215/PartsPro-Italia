import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/system-health";

export const runtime = "nodejs";

export async function GET() {
  const health = await getSystemHealth();
  return NextResponse.json(health, { status: health.ok ? 200 : 503 });
}
