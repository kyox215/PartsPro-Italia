import { NextResponse } from "next/server";
import { assertAdminPermission } from "@/lib/auth";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await assertAdminPermission("products:write");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const url = new URL(request.url);
  const sku = normalizeCode(url.searchParams.get("sku"));
  const slug = normalizeSlug(url.searchParams.get("slug"));

  if (!sku && !slug) {
    return NextResponse.json({
      sku: { exists: false, suggestion: "" },
      slug: { exists: false, suggestion: "" },
    });
  }

  if (!hasSupabaseAdminConfig()) {
    return NextResponse.json({
      mode: "demo",
      sku: { exists: false, suggestion: sku },
      slug: { exists: false, suggestion: slug },
    });
  }

  const supabase = getSupabaseAdminClient();
  let skuResult;
  let slugResult;

  try {
    [skuResult, slugResult] = await Promise.all([
      checkValue({
        table: "skus",
        column: "sku",
        value: sku,
        fallbackSuffix: "-2",
        supabase,
      }),
      checkValue({
        table: "products",
        column: "slug",
        value: slug,
        fallbackSuffix: "-2",
        supabase,
      }),
    ]);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Conflict check failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    mode: "supabase",
    sku: skuResult,
    slug: slugResult,
  });
}

async function checkValue({
  table,
  column,
  value,
  fallbackSuffix,
  supabase,
}: {
  table: "products" | "skus";
  column: "slug" | "sku";
  value: string;
  fallbackSuffix: string;
  supabase: ReturnType<typeof getSupabaseAdminClient>;
}) {
  if (!value) return { exists: false, suggestion: "" };

  const exists = await valueExists({ table, column, value, supabase });
  if (!exists) return { exists: false, suggestion: value };

  for (let index = 2; index <= 99; index += 1) {
    const candidate = `${value.replace(/-\d+$/, "")}${fallbackSuffix.replace("2", String(index))}`;
    const candidateExists = await valueExists({
      table,
      column,
      value: candidate,
      supabase,
    });
    if (!candidateExists) return { exists: true, suggestion: candidate };
  }

  return { exists: true, suggestion: `${value}-${Date.now()}` };
}

async function valueExists({
  table,
  column,
  value,
  supabase,
}: {
  table: "products" | "skus";
  column: "slug" | "sku";
  value: string;
  supabase: ReturnType<typeof getSupabaseAdminClient>;
}) {
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq(column, value)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}

function normalizeCode(value: string | null) {
  return (value ?? "").trim().toUpperCase();
}

function normalizeSlug(value: string | null) {
  return (value ?? "").trim().toLowerCase();
}
