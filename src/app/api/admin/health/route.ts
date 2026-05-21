import { NextResponse } from "next/server";
import { assertAdminPermission } from "@/lib/auth";
import { getSystemHealth } from "@/lib/system-health";

export const runtime = "nodejs";

export async function GET() {
  const admin = await assertAdminPermission("system:read");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const health = await getSystemHealth();
  return NextResponse.json(health, { status: health.ok ? 200 : 503 });
}
