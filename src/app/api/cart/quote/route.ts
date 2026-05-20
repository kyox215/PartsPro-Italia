import { NextResponse } from "next/server";
import { z } from "zod";
import { loadCartQuote } from "@/lib/cart-quote";
import { isLocale, type Locale } from "@/lib/i18n";
import { parseRequestBody } from "@/lib/request";

export const runtime = "nodejs";

const cartQuoteSchema = z.object({
  locale: z.enum(["it", "zh"]).default("it"),
  items: z
    .array(
      z.object({
        sku: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .default([]),
});

export async function POST(request: Request) {
  const body = await parseRequestBody(request);
  const parsed = cartQuoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid cart payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const locale: Locale = isLocale(parsed.data.locale) ? parsed.data.locale : "it";
  const quote = await loadCartQuote({ locale, items: parsed.data.items });
  return NextResponse.json(quote);
}
