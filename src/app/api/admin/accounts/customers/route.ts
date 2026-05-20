import { NextResponse } from "next/server";
import { getAdminCustomerRows } from "@/lib/admin-customers";
import { assertAdminPermission } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const admin = await assertAdminPermission("accounts:read");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const customers = await getAdminCustomerRows();
  return NextResponse.json({ customers });
}
