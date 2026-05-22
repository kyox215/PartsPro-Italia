import { NextResponse } from "next/server";
import { cartQuoteSchema } from "@/admin/schemas/order-checkout";
import { quoteCheckoutCart } from "@/admin/services/order-checkout";
import { parseRequestBody } from "@/lib/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await parseRequestBody(request);
  const parsed = cartQuoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid cart payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const quote = await quoteCheckoutCart(parsed.data);
  return NextResponse.json(quote);
}
