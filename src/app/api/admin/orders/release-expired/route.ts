import { NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/order-workflow";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await releaseExpiredReservations();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  return GET(request);
}
