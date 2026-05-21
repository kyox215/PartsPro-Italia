import { NextResponse } from "next/server";
import {
  getProductImageStoragePath,
  productImageBucket,
} from "@/lib/product-image-storage";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawPath = url.searchParams.get("path") ?? "";
  const path = getProductImageStoragePath(rawPath) ?? rawPath;

  if (!path || path.includes("..") || path.startsWith("/")) {
    return NextResponse.json({ error: "Invalid product image path" }, { status: 400 });
  }

  if (!hasSupabaseAdminConfig()) {
    return NextResponse.json({ error: "Storage is not configured" }, { status: 503 });
  }

  const { data } = getSupabaseAdminClient()
    .storage
    .from(productImageBucket)
    .getPublicUrl(path);

  if (!data.publicUrl) {
    return NextResponse.json({ error: "Unable to build public URL" }, { status: 404 });
  }

  const response = NextResponse.redirect(data.publicUrl, 302);
  response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return response;
}
