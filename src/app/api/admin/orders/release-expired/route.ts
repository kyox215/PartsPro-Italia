import { NextResponse } from "next/server";
import { adminReleaseExpiredOrderReservations } from "@/admin/services/order-mutations";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await adminReleaseExpiredOrderReservations();
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result.data.result);
}

export async function POST(request: Request) {
  return GET(request);
}
