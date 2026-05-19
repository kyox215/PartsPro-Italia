import { products } from "@/lib/catalog";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

export type AdminProductRow = {
  id: string;
  productId: string;
  skuId: string;
  slug: string;
  sku: string;
  barcodeEan13: string | null;
  brand: string;
  model: string;
  category: string;
  qualityGrade: string;
  nameIt: string;
  nameZh: string;
  costPrice: number | null;
  retailPrice: number;
  b2bPrice: number;
  stockOnHand: number;
  stockReserved: number;
  incomingQty: number;
  incomingReserved: number;
  isActive: boolean;
};

export async function getAdminProductRows(): Promise<AdminProductRow[]> {
  if (!hasSupabaseAdminConfig()) {
    return products.map((product) => ({
      id: product.sku,
      productId: product.slug,
      skuId: product.sku,
      slug: product.slug,
      sku: product.sku,
      barcodeEan13: null,
      brand: product.brand,
      model: product.model,
      category: product.category,
      qualityGrade: product.quality,
      nameIt: product.names.it,
      nameZh: product.names.zh,
      costPrice: null,
      retailPrice: product.retailPrice,
      b2bPrice: product.b2bPrice,
      stockOnHand: product.stock,
      stockReserved: 0,
      incomingQty: product.incoming ?? 0,
      incomingReserved: 0,
      isActive: true,
    }));
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("skus")
    .select(
      `
      id,
      sku,
      barcode_ean13,
      cost_price,
      retail_price,
      b2b_price,
      is_active,
      products (
        id,
        slug,
        brand,
        model,
        category,
        quality_grade,
        name_it,
        name_zh,
        is_active
      ),
      inventory (
        stock_on_hand,
        stock_reserved,
        incoming_reserved,
        incoming_qty
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to load admin products", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    const inventory = Array.isArray(row.inventory) ? row.inventory[0] : row.inventory;

    return {
      id: row.id,
      productId: product?.id ?? "",
      skuId: row.id,
      slug: product?.slug ?? "",
      sku: row.sku,
      barcodeEan13: row.barcode_ean13 ?? null,
      brand: product?.brand ?? "",
      model: product?.model ?? "",
      category: product?.category ?? "",
      qualityGrade: product?.quality_grade ?? "",
      nameIt: product?.name_it ?? "",
      nameZh: product?.name_zh ?? "",
      costPrice: row.cost_price === null ? null : Number(row.cost_price ?? 0),
      retailPrice: Number(row.retail_price ?? 0),
      b2bPrice: Number(row.b2b_price ?? 0),
      stockOnHand: Number(inventory?.stock_on_hand ?? 0),
      stockReserved: Number(inventory?.stock_reserved ?? 0),
      incomingQty: Number(inventory?.incoming_qty ?? 0),
      incomingReserved: Number(inventory?.incoming_reserved ?? 0),
      isActive: Boolean(row.is_active && product?.is_active),
    };
  });
}
