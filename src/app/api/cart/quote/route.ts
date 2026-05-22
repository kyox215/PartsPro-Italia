import { NextResponse } from "next/server";
import { cartQuoteSchema } from "@/lib/checkout-cart-schema";
import { quoteCheckoutCart } from "@/lib/checkout-order-service";
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
