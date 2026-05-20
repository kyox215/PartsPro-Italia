import { products } from "@/lib/catalog";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

export type AdminProductRow = {
  id: string;
  productId: string;
  skuId: string;
  inventoryId: string | null;
  slug: string;
  sku: string;
  barcodeEan13: string | null;
  brand: string;
  model: string;
  category: string;
  qualityGrade: string;
  nameIt: string;
  nameZh: string;
  descriptionIt: string | null;
  descriptionZh: string | null;
  imageUrl: string | null;
  costPrice: number | null;
  retailPrice: number;
  b2bPrice: number;
  color: string | null;
  compatibility: string[];
  moq: number;
  vatRate: number;
  stockOnHand: number;
  stockReserved: number;
  incomingQty: number;
  incomingReserved: number;
  reorderPoint: number;
  safetyStock: number;
  attributeCount: number;
  productActive: boolean;
  skuActive: boolean;
  isActive: boolean;
  completenessIssues: string[];
  updatedAt: string | null;
};

export type AdminProductDetail = AdminProductRow & {
  attributes: Array<{
    key: string;
    labelIt: string;
    labelZh: string;
    value: string;
  }>;
};

type AdminProductQueryRow = {
  id: string;
  sku: string;
  barcode_ean13?: string | null;
  cost_price?: number | string | null;
  retail_price?: number | string | null;
  b2b_price?: number | string | null;
  color?: string | null;
  compatibility?: string[] | null;
  moq?: number | string | null;
  vat_rate?: number | string | null;
  is_active?: boolean | null;
  updated_at?: string | null;
  products?:
    | {
        id?: string | null;
        slug?: string | null;
        brand?: string | null;
        model?: string | null;
        category?: string | null;
        quality_grade?: string | null;
        name_it?: string | null;
        name_zh?: string | null;
        description_it?: string | null;
        description_zh?: string | null;
        image_url?: string | null;
        updated_at?: string | null;
        is_active?: boolean | null;
      }
    | Array<{
        id?: string | null;
        slug?: string | null;
        brand?: string | null;
        model?: string | null;
        category?: string | null;
        quality_grade?: string | null;
        name_it?: string | null;
        name_zh?: string | null;
        description_it?: string | null;
        description_zh?: string | null;
        image_url?: string | null;
        updated_at?: string | null;
        is_active?: boolean | null;
      }>
    | null;
  inventory?:
    | {
        id?: string | null;
        stock_on_hand?: number | null;
        stock_reserved?: number | null;
        incoming_reserved?: number | null;
        incoming_qty?: number | null;
        reorder_point?: number | null;
        safety_stock?: number | null;
      }
    | Array<{
        id?: string | null;
        stock_on_hand?: number | null;
        stock_reserved?: number | null;
        incoming_reserved?: number | null;
        incoming_qty?: number | null;
        reorder_point?: number | null;
        safety_stock?: number | null;
      }>
    | null;
};

const adminProductSelect = `
  id,
  sku,
  barcode_ean13,
  cost_price,
  retail_price,
  b2b_price,
  color,
  compatibility,
  moq,
  vat_rate,
  preorder_lead_time_min_days,
  preorder_lead_time_max_days,
  is_active,
  updated_at,
  products (
    id,
    slug,
    brand,
    model,
    category,
    quality_grade,
    name_it,
    name_zh,
    description_it,
    description_zh,
    image_url,
    updated_at,
    is_active
  ),
  inventory (
    id,
    stock_on_hand,
    stock_reserved,
    incoming_reserved,
    incoming_qty,
    reorder_point,
    safety_stock
  )
`;

export async function getAdminProductRows(): Promise<AdminProductRow[]> {
  if (!hasSupabaseAdminConfig()) {
    return products.map((product) => ({
      id: product.sku,
      productId: product.slug,
      skuId: product.sku,
      inventoryId: product.sku,
      slug: product.slug,
      sku: product.sku,
      barcodeEan13: null,
      brand: product.brand,
      model: product.model,
      category: product.category,
      qualityGrade: product.quality,
      nameIt: product.names.it,
      nameZh: product.names.zh,
      descriptionIt: product.descriptions.it,
      descriptionZh: product.descriptions.zh,
      imageUrl: product.image,
      costPrice: null,
      retailPrice: product.retailPrice,
      b2bPrice: product.b2bPrice,
      color: null,
      compatibility: product.compatibility,
      moq: product.moq,
      vatRate: 0.22,
      stockOnHand: product.stock,
      stockReserved: 0,
      incomingQty: product.incoming ?? 0,
      incomingReserved: 0,
      reorderPoint: 5,
      safetyStock: 2,
      attributeCount: 2,
      productActive: true,
      skuActive: true,
      isActive: true,
      completenessIssues: [],
      updatedAt: new Date().toISOString(),
    }));
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("skus")
    .select(adminProductSelect)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("Failed to load admin products", error);
    return [];
  }

  const skuIds = (data ?? []).map((row) => row.id).filter(Boolean);
  const attributeCounts = await loadAttributeCounts(skuIds);

  return ((data ?? []) as AdminProductQueryRow[]).map((row) =>
    mapAdminProductRow(row, attributeCounts.get(row.id) ?? 0),
  );
}

export async function getAdminProductDetail(
  skuIdOrSku: string,
): Promise<AdminProductDetail | null> {
  if (!hasSupabaseAdminConfig()) {
    const rows = await getAdminProductRows();
    const row = rows.find(
      (item) => item.skuId === skuIdOrSku || item.sku === skuIdOrSku,
    );
    if (!row) return null;

    return {
      ...row,
      attributes: [
        {
          key: "demo_status",
          labelIt: "Stato demo",
          labelZh: "演示状态",
          value: "ready",
        },
      ],
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data: byId, error: byIdError } = await supabase
    .from("skus")
    .select(adminProductSelect)
    .eq("id", skuIdOrSku)
    .maybeSingle();

  if (byIdError) {
    console.error("Failed to load admin product by id", byIdError);
  }

  let skuRow = byId as AdminProductQueryRow | null;

  if (!skuRow) {
    const { data: bySku, error: bySkuError } = await supabase
      .from("skus")
      .select(adminProductSelect)
      .eq("sku", skuIdOrSku)
      .maybeSingle();

    if (bySkuError) {
      console.error("Failed to load admin product by SKU", bySkuError);
      return null;
    }

    skuRow = bySku as AdminProductQueryRow | null;
  }

  if (!skuRow) return null;

  const { data, error } = await supabase
    .from("sku_attribute_values")
    .select("value, catalog_attribute_definitions ( key, label_it, label_zh )")
    .eq("sku_id", skuRow.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load product attributes", error);
  }

  const attributes = (data ?? []).map((attribute) => {
    const definition = Array.isArray(attribute.catalog_attribute_definitions)
      ? attribute.catalog_attribute_definitions[0]
      : attribute.catalog_attribute_definitions;

    return {
      key: definition?.key ?? "",
      labelIt: definition?.label_it ?? "",
      labelZh: definition?.label_zh ?? "",
      value: attribute.value,
    };
  });

  return {
    ...mapAdminProductRow(skuRow, attributes.length),
    attributes,
  };
}

function mapAdminProductRow(
  row: AdminProductQueryRow,
  attributeCount: number,
): AdminProductRow {
  const product = Array.isArray(row.products) ? row.products[0] : row.products;
  const inventory = Array.isArray(row.inventory) ? row.inventory[0] : row.inventory;
  const productActive = Boolean(product?.is_active);
  const skuActive = Boolean(row.is_active);

  const mapped: AdminProductRow = {
    id: row.id,
    productId: product?.id ?? "",
    skuId: row.id,
    inventoryId: inventory?.id ?? null,
    slug: product?.slug ?? "",
    sku: row.sku,
    barcodeEan13: row.barcode_ean13 ?? null,
    brand: product?.brand ?? "",
    model: product?.model ?? "",
    category: product?.category ?? "",
    qualityGrade: product?.quality_grade ?? "",
    nameIt: product?.name_it ?? "",
    nameZh: product?.name_zh ?? "",
    descriptionIt: product?.description_it ?? null,
    descriptionZh: product?.description_zh ?? null,
    imageUrl: product?.image_url ?? null,
    costPrice: row.cost_price === null ? null : Number(row.cost_price ?? 0),
    retailPrice: Number(row.retail_price ?? 0),
    b2bPrice: Number(row.b2b_price ?? 0),
    color: row.color ?? null,
    compatibility: Array.isArray(row.compatibility) ? row.compatibility : [],
    moq: Number(row.moq ?? 1),
    vatRate: Number(row.vat_rate ?? 0.22),
    stockOnHand: Number(inventory?.stock_on_hand ?? 0),
    stockReserved: Number(inventory?.stock_reserved ?? 0),
    incomingQty: Number(inventory?.incoming_qty ?? 0),
    incomingReserved: Number(inventory?.incoming_reserved ?? 0),
    reorderPoint: Number(inventory?.reorder_point ?? 0),
    safetyStock: Number(inventory?.safety_stock ?? 0),
    attributeCount,
    productActive,
    skuActive,
    isActive: Boolean(skuActive && productActive),
    completenessIssues: [],
    updatedAt: row.updated_at ?? product?.updated_at ?? null,
  };

  mapped.completenessIssues = getProductCompletenessIssues(mapped);
  return mapped;
}

async function loadAttributeCounts(skuIds: string[]) {
  const counts = new Map<string, number>();
  if (!hasSupabaseAdminConfig() || skuIds.length === 0) return counts;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sku_attribute_values")
    .select("sku_id")
    .in("sku_id", skuIds);

  if (error) {
    console.error("Failed to load SKU attribute counts", error);
    return counts;
  }

  (data ?? []).forEach((row) => {
    counts.set(row.sku_id, (counts.get(row.sku_id) ?? 0) + 1);
  });
  return counts;
}

function getProductCompletenessIssues(row: AdminProductRow) {
  const issues: string[] = [];
  if (!row.nameZh || row.nameZh === row.nameIt) issues.push("missing_zh");
  if (!row.descriptionZh) issues.push("missing_zh_description");
  if (!row.imageUrl) issues.push("missing_image");
  if (row.attributeCount === 0) issues.push("missing_attributes");
  if (row.retailPrice <= 0 || row.b2bPrice <= 0) issues.push("price_error");
  if (row.costPrice !== null && row.b2bPrice < row.costPrice) {
    issues.push("margin_risk");
  }
  if (row.stockOnHand - row.stockReserved <= row.safetyStock && row.reorderPoint > 0) {
    issues.push("stock_risk");
  }
  if (!row.isActive) issues.push("archived");
  return issues;
}
