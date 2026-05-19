import type { SupabaseClient } from "@supabase/supabase-js";
import { categories } from "@/lib/catalog";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

export type AdminCatalogAttributeRow = {
  id: string;
  key: string;
  labelIt: string;
  labelZh: string;
  inputType: string;
  unit: string | null;
  isFilterable: boolean;
  options: Array<{ value: string; labelIt: string; labelZh: string }>;
};

export type ParsedSkuAttribute = {
  key: string;
  value: string;
};

export async function getAdminCatalogAttributeRows(): Promise<
  AdminCatalogAttributeRow[]
> {
  if (!hasSupabaseAdminConfig()) return [];

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("catalog_attribute_definitions")
    .select(
      `
      id,
      key,
      label_it,
      label_zh,
      input_type,
      unit,
      is_filterable,
      catalog_attribute_options (
        value,
        label_it,
        label_zh,
        sort_order
      )
    `,
    )
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to load catalog attributes", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    key: row.key,
    labelIt: row.label_it,
    labelZh: row.label_zh,
    inputType: row.input_type,
    unit: row.unit,
    isFilterable: Boolean(row.is_filterable),
    options: ((row.catalog_attribute_options ?? []) as Array<{
      value: string;
      label_it: string;
      label_zh: string;
    }>).map((option) => ({
      value: option.value,
      labelIt: option.label_it,
      labelZh: option.label_zh,
    })),
  }));
}

export function parseSkuAttributes(rawValue: string | undefined) {
  if (!rawValue) return [];

  const attributes: ParsedSkuAttribute[] = [];
  rawValue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [rawKey, ...rawValueParts] = line.split("=");
      const key = normalizeAttributeKey(rawKey);
      const value = rawValueParts.join("=").trim();
      if (key && value) {
        attributes.push({ key, value });
      }
    });

  return attributes;
}

export async function upsertSkuAttributeValues(
  supabase: SupabaseClient,
  skuId: string,
  attributes: ParsedSkuAttribute[],
) {
  for (const attribute of attributes) {
    const { data: definition, error: definitionError } = await supabase
      .from("catalog_attribute_definitions")
      .upsert(
        {
          key: attribute.key,
          label_it: humanizeAttributeKey(attribute.key),
          label_zh: humanizeAttributeKey(attribute.key),
          input_type: "select",
          is_filterable: true,
        },
        { onConflict: "key" },
      )
      .select("id")
      .single();

    if (definitionError || !definition) {
      throw new Error(definitionError?.message ?? "Attribute definition failed");
    }

    await supabase.from("catalog_attribute_options").upsert(
      {
        attribute_id: definition.id,
        value: attribute.value,
        label_it: attribute.value,
        label_zh: attribute.value,
      },
      { onConflict: "attribute_id,value" },
    );

    const valueNumber = Number.parseFloat(attribute.value);
    const { error } = await supabase.from("sku_attribute_values").upsert(
      {
        sku_id: skuId,
        attribute_id: definition.id,
        value: attribute.value,
        value_number: Number.isFinite(valueNumber) ? valueNumber : null,
      },
      { onConflict: "sku_id,attribute_id,value" },
    );

    if (error) throw new Error(error.message);
  }
}

export async function ensureCatalogReferenceRows(
  supabase: SupabaseClient,
  payload: { brand: string; model: string; category: string },
) {
  const brandSlug = slugify(payload.brand);
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .upsert({ name: payload.brand, slug: brandSlug }, { onConflict: "slug" })
    .select("id")
    .single();

  if (brandError || !brand) {
    throw new Error(brandError?.message ?? "Brand upsert failed");
  }

  const category = categories.find((item) => item.id === payload.category);
  await supabase.from("categories").upsert(
    {
      slug: payload.category,
      name_it: category?.label.it ?? payload.category,
      name_zh: category?.label.zh ?? payload.category,
    },
    { onConflict: "slug" },
  );

  await supabase.from("phone_models").upsert(
    {
      brand_id: brand.id,
      name: payload.model,
      slug: slugify(`${payload.brand}-${payload.model}`),
      model_codes: [payload.model],
    },
    { onConflict: "slug" },
  );
}

export function normalizeAttributeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function humanizeAttributeKey(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}
