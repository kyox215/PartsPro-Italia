import { products, type Product } from "@/lib/catalog";
import { getAuthContext } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";
import {
  getSupabaseServerClient,
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";

const pageSize = 24;
const maxFacetRows = 1000;

export type CatalogSort =
  | "relevance"
  | "name_asc"
  | "brand_asc"
  | "price_asc"
  | "price_desc";

export type CatalogSearchState = {
  q: string;
  brand: string;
  model: string;
  category: string;
  quality: string;
  availability: string;
  minPrice: string;
  maxPrice: string;
  sort: CatalogSort;
  page: number;
  attrs: Record<string, string[]>;
};

export type CatalogItem = {
  skuId: string;
  productId: string;
  slug: string;
  sku: string;
  brand: string;
  model: string;
  category: string;
  categoryLabel: string;
  quality: string;
  name: string;
  description: string;
  image: string | null;
  color: string | null;
  compatibility: string[];
  moq: number;
  retailPrice: number | null;
  b2bPrice: number | null;
  stockOnHand: number | null;
  availableStock: number | null;
  incomingQty: number | null;
};

export type CatalogFacetOption = {
  value: string;
  label: string;
  count: number;
  active: boolean;
};

export type CatalogFacet = {
  key: string;
  label: string;
  kind: "single" | "multi";
  options: CatalogFacetOption[];
};

export type CatalogPageData = {
  items: CatalogItem[];
  facets: CatalogFacet[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  state: CatalogSearchState;
  isPriceVisible: boolean;
  isSupabaseBacked: boolean;
};

export type CatalogItemDetail = {
  item: CatalogItem;
  attributes: Array<{ key: string; label: string; value: string }>;
  isPriceVisible: boolean;
  isSupabaseBacked: boolean;
};

type SearchParams = Record<string, string | string[] | undefined>;

type CatalogRow = {
  sku_id: string;
  product_id: string;
  slug: string;
  sku: string;
  brand: string;
  model: string;
  category: string;
  category_name_it?: string | null;
  category_name_zh?: string | null;
  quality_grade: string;
  name_it: string;
  name_zh: string;
  description_it?: string | null;
  description_zh?: string | null;
  image_url?: string | null;
  color?: string | null;
  compatibility?: string[] | null;
  moq?: number | null;
  retail_price?: number | string | null;
  b2b_price?: number | string | null;
  stock_on_hand?: number | null;
  available_stock?: number | null;
  incoming_qty?: number | null;
};

type AttributeValueRow = {
  sku_id: string;
  key: string;
  label_it: string;
  label_zh: string;
  input_type: string;
  value: string;
  value_label_it: string;
  value_label_zh: string;
  attribute_sort_order: number;
  value_sort_order: number;
};

type CatalogQueryBuilder = {
  eq(column: string, value: string | number | boolean): CatalogQueryBuilder;
  gt(column: string, value: number): CatalogQueryBuilder;
  gte(column: string, value: number): CatalogQueryBuilder;
  in(column: string, values: readonly string[]): CatalogQueryBuilder;
  lte(column: string, value: number): CatalogQueryBuilder;
  or(filters: string): CatalogQueryBuilder;
  order(column: string, options: { ascending: boolean }): CatalogQueryBuilder;
  range(
    from: number,
    to: number,
  ): PromiseLike<{
    data: unknown;
    error: Error | null;
    count: number | null;
  }>;
};

export async function loadCatalogPage({
  locale,
  searchParams,
}: Readonly<{
  locale: Locale;
  searchParams: SearchParams;
}>): Promise<CatalogPageData> {
  const state = parseCatalogSearchParams(searchParams);
  const auth = await getAuthContext();
  const isPriceVisible = Boolean(auth.user);

  if (!hasSupabasePublicConfig()) {
    return loadLocalCatalogPage(locale, state, isPriceVisible);
  }

  try {
    return await loadSupabaseCatalogPage(locale, state, isPriceVisible);
  } catch (error) {
    console.error("Failed to load Supabase catalog, using local fallback", error);
    return loadLocalCatalogPage(locale, state, isPriceVisible);
  }
}

export async function loadCatalogItemBySlug(
  locale: Locale,
  slug: string,
): Promise<CatalogItemDetail | null> {
  const auth = await getAuthContext();
  const isPriceVisible = Boolean(auth.user);

  if (!hasSupabasePublicConfig()) {
    const product = products.find((item) => item.slug === slug);
    if (!product) return null;
    return {
      item: mapLocalProduct(product, locale, isPriceVisible),
      attributes: [],
      isPriceVisible,
      isSupabaseBacked: false,
    };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const viewName = isPriceVisible ? "catalog_private_items" : "catalog_public_items";
    const { data, error } = await supabase
      .from(viewName)
      .select("*")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      const product = products.find((item) => item.slug === slug);
      if (!product) return null;
      return {
        item: mapLocalProduct(product, locale, isPriceVisible),
        attributes: [],
        isPriceVisible,
        isSupabaseBacked: false,
      };
    }

    const row = data as CatalogRow;
    const attributeRows = await loadAttributeRows([row.sku_id]);
    return {
      item: mapCatalogRow(row, locale, isPriceVisible),
      attributes: attributeRows.map((attribute) => ({
        key: attribute.key,
        label: locale === "it" ? attribute.label_it : attribute.label_zh,
        value: locale === "it" ? attribute.value_label_it : attribute.value_label_zh,
      })),
      isPriceVisible,
      isSupabaseBacked: true,
    };
  } catch (error) {
    console.error("Failed to load catalog item", error);
    const product = products.find((item) => item.slug === slug);
    if (!product) return null;
    return {
      item: mapLocalProduct(product, locale, isPriceVisible),
      attributes: [],
      isPriceVisible,
      isSupabaseBacked: false,
    };
  }
}

export function parseCatalogSearchParams(searchParams: SearchParams): CatalogSearchState {
  const sort = valueOf(searchParams.sort);
  const attrs = Object.entries(searchParams).reduce<Record<string, string[]>>(
    (result, [key, rawValue]) => {
      if (!key.startsWith("attr_")) return result;
      const values = valuesOf(rawValue);
      if (values.length > 0) {
        result[key.slice(5)] = values;
      }
      return result;
    },
    {},
  );

  return {
    q: valueOf(searchParams.q),
    brand: valueOf(searchParams.brand),
    model: valueOf(searchParams.model),
    category: valueOf(searchParams.category),
    quality: valueOf(searchParams.quality),
    availability: valueOf(searchParams.availability),
    minPrice: valueOf(searchParams.minPrice),
    maxPrice: valueOf(searchParams.maxPrice),
    sort: isCatalogSort(sort) ? sort : "relevance",
    page: Math.max(1, Number.parseInt(valueOf(searchParams.page), 10) || 1),
    attrs,
  };
}

export function catalogStateToParams(
  state: CatalogSearchState,
  overrides: Partial<CatalogSearchState> = {},
) {
  const nextState = { ...state, ...overrides };
  const params = new URLSearchParams();
  appendParam(params, "q", nextState.q);
  appendParam(params, "brand", nextState.brand);
  appendParam(params, "model", nextState.model);
  appendParam(params, "category", nextState.category);
  appendParam(params, "quality", nextState.quality);
  appendParam(params, "availability", nextState.availability);
  appendParam(params, "minPrice", nextState.minPrice);
  appendParam(params, "maxPrice", nextState.maxPrice);
  appendParam(params, "sort", nextState.sort === "relevance" ? "" : nextState.sort);
  appendParam(params, "page", nextState.page > 1 ? String(nextState.page) : "");

  Object.entries(nextState.attrs).forEach(([key, values]) => {
    values.forEach((value) => appendParam(params, `attr_${key}`, value));
  });

  return params;
}

async function loadSupabaseCatalogPage(
  locale: Locale,
  state: CatalogSearchState,
  isPriceVisible: boolean,
): Promise<CatalogPageData> {
  const supabase = await getSupabaseServerClient();
  const attrSkuIds = await getSkuIdsForAttributeFilters(state);
  const viewName = isPriceVisible ? "catalog_private_items" : "catalog_public_items";
  const offset = (state.page - 1) * pageSize;

  const itemQuery = applyCatalogFilters(
    selectCatalogView(supabase, viewName, true),
    state,
    isPriceVisible,
    attrSkuIds,
  );
  applySort(itemQuery, state.sort, isPriceVisible);
  const { data, error, count } = await itemQuery.range(offset, offset + pageSize - 1);

  if (error) throw error;

  const facetQuery = applyCatalogFilters(
    selectCatalogView(supabase, viewName),
    state,
    isPriceVisible,
    attrSkuIds,
  );
  applySort(facetQuery, "brand_asc", isPriceVisible);
  const { data: facetData, error: facetError } = await facetQuery.range(
    0,
    maxFacetRows - 1,
  );

  if (facetError) throw facetError;

  const facetRows = (facetData ?? []) as CatalogRow[];
  const rows = (data ?? []) as CatalogRow[];
  const attributeRows = await loadAttributeRows(facetRows.map((row) => row.sku_id));
  const total = count ?? rows.length;

  return {
    items: rows.map((row) => mapCatalogRow(row, locale, isPriceVisible)),
    facets: buildFacets(facetRows, attributeRows, locale, state, isPriceVisible),
    total,
    page: state.page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    state,
    isPriceVisible,
    isSupabaseBacked: true,
  };
}

async function getSkuIdsForAttributeFilters(state: CatalogSearchState) {
  const filters = Object.entries(state.attrs).filter(([, values]) => values.length > 0);
  if (filters.length === 0 || !hasSupabasePublicConfig()) return null;

  const supabase = await getSupabaseServerClient();
  let matching: Set<string> | null = null;

  for (const [key, values] of filters) {
    const { data, error } = await supabase
      .from("catalog_attribute_values")
      .select("sku_id")
      .eq("key", key)
      .in("value", values);

    if (error) throw error;

    const nextSet: Set<string> = new Set(
      (data ?? []).map((row) => String(row.sku_id)),
    );
    matching =
      matching === null
        ? nextSet
        : new Set<string>(
            [...matching].filter((skuId: string) => nextSet.has(skuId)),
          );
  }

  return matching ?? null;
}

async function loadAttributeRows(skuIds: string[]) {
  if (skuIds.length === 0 || !hasSupabasePublicConfig()) return [];

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("catalog_attribute_values")
    .select(
      "sku_id, key, label_it, label_zh, input_type, value, value_label_it, value_label_zh, attribute_sort_order, value_sort_order",
    )
    .eq("is_filterable", true)
    .in("sku_id", skuIds);

  if (error) throw error;
  return (data ?? []) as AttributeValueRow[];
}

function applyCatalogFilters(
  query: CatalogQueryBuilder,
  state: CatalogSearchState,
  isPriceVisible: boolean,
  attrSkuIds: Set<string> | null,
) {
  let nextQuery = query;

  if (state.brand) nextQuery = query.eq("brand", state.brand);
  if (state.model) nextQuery = nextQuery.eq("model", state.model);
  if (state.category) nextQuery = nextQuery.eq("category", state.category);
  if (state.quality) nextQuery = nextQuery.eq("quality_grade", state.quality);

  const q = sanitizeSearchTerm(state.q);
  if (q) {
    const pattern = `%${q}%`;
    nextQuery = nextQuery.or(
      [
        `sku.ilike.${pattern}`,
        `brand.ilike.${pattern}`,
        `model.ilike.${pattern}`,
        `name_it.ilike.${pattern}`,
        `name_zh.ilike.${pattern}`,
      ].join(","),
    );
  }

  if (attrSkuIds) {
    if (attrSkuIds.size === 0) {
      nextQuery = nextQuery.eq("sku_id", "00000000-0000-0000-0000-000000000000");
    } else {
      nextQuery = nextQuery.in("sku_id", [...attrSkuIds]);
    }
  }

  if (isPriceVisible) {
    const minPrice = Number.parseFloat(state.minPrice);
    const maxPrice = Number.parseFloat(state.maxPrice);
    if (Number.isFinite(minPrice)) nextQuery = nextQuery.gte("b2b_price", minPrice);
    if (Number.isFinite(maxPrice)) nextQuery = nextQuery.lte("b2b_price", maxPrice);

    if (state.availability === "in_stock") {
      nextQuery = nextQuery.gt("available_stock", 0);
    } else if (state.availability === "incoming") {
      nextQuery = nextQuery.eq("available_stock", 0).gt("incoming_qty", 0);
    } else if (state.availability === "out_of_stock") {
      nextQuery = nextQuery.eq("available_stock", 0).eq("incoming_qty", 0);
    } else if (state.availability === "low_stock") {
      nextQuery = nextQuery.gt("available_stock", 0).lte("available_stock", 10);
    }
  }

  return nextQuery;
}

function applySort(
  query: CatalogQueryBuilder,
  sort: CatalogSort,
  isPriceVisible: boolean,
) {
  if (sort === "price_asc" && isPriceVisible) {
    query.order("b2b_price", { ascending: true }).order("sku", { ascending: true });
    return;
  }

  if (sort === "price_desc" && isPriceVisible) {
    query.order("b2b_price", { ascending: false }).order("sku", { ascending: true });
    return;
  }

  if (sort === "name_asc") {
    query.order("name_it", { ascending: true }).order("sku", { ascending: true });
    return;
  }

  query
    .order("brand", { ascending: true })
    .order("model", { ascending: true })
    .order("sku", { ascending: true });
}

function selectCatalogView(
  client: { from(table: string): unknown },
  viewName: string,
  withCount = false,
) {
  const table = client.from(viewName) as {
    select(columns: string, options?: { count: "exact" }): CatalogQueryBuilder;
  };

  return table.select("*", withCount ? { count: "exact" } : undefined);
}

function loadLocalCatalogPage(
  locale: Locale,
  state: CatalogSearchState,
  isPriceVisible: boolean,
): CatalogPageData {
  const filtered = products.filter((product) => matchesLocalProduct(product, state));
  const sorted = sortLocalProducts(filtered, state.sort, isPriceVisible);
  const offset = (state.page - 1) * pageSize;
  const pageItems = sorted.slice(offset, offset + pageSize);

  return {
    items: pageItems.map((product) => mapLocalProduct(product, locale, isPriceVisible)),
    facets: buildLocalFacets(filtered, state, locale, isPriceVisible),
    total: filtered.length,
    page: state.page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(filtered.length / pageSize)),
    state,
    isPriceVisible,
    isSupabaseBacked: false,
  };
}

function buildFacets(
  rows: CatalogRow[],
  attributeRows: AttributeValueRow[],
  locale: Locale,
  state: CatalogSearchState,
  isPriceVisible: boolean,
) {
  const facets: CatalogFacet[] = [
    {
      key: "brand",
      label: locale === "it" ? "Brand" : "品牌",
      kind: "single",
      options: countOptions(rows, "brand", state.brand),
    },
    {
      key: "model",
      label: locale === "it" ? "Modello" : "型号",
      kind: "single",
      options: countOptions(rows, "model", state.model),
    },
    {
      key: "category",
      label: locale === "it" ? "Categoria" : "品类",
      kind: "single",
      options: countCategoryOptions(rows, locale, state.category),
    },
    {
      key: "quality",
      label: locale === "it" ? "Qualita" : "质量等级",
      kind: "single",
      options: countOptions(rows, "quality_grade", state.quality),
    },
  ];

  if (isPriceVisible) {
    facets.push({
      key: "availability",
      label: locale === "it" ? "Disponibilita" : "库存状态",
      kind: "single",
      options: buildAvailabilityOptions(rows, state.availability, locale),
    });
  }

  facets.push(...buildAttributeFacets(attributeRows, locale, state));

  return facets.filter((facet) => facet.options.length > 0);
}

function buildLocalFacets(
  filtered: Product[],
  state: CatalogSearchState,
  locale: Locale,
  isPriceVisible: boolean,
) {
  const rows = filtered.map((product) => ({
    sku_id: product.sku,
    product_id: product.slug,
    slug: product.slug,
    sku: product.sku,
    brand: product.brand,
    model: product.model,
    category: product.category,
    category_name_it: product.category,
    category_name_zh: product.category,
    quality_grade: product.quality,
    name_it: product.names.it,
    name_zh: product.names.zh,
    moq: product.moq,
    available_stock: product.stock,
    incoming_qty: product.incoming ?? 0,
  }));

  return buildFacets(rows, [], locale, state, isPriceVisible);
}

function buildAttributeFacets(
  rows: AttributeValueRow[],
  locale: Locale,
  state: CatalogSearchState,
) {
  const grouped = new Map<
    string,
    {
      label: string;
      sortOrder: number;
      options: Map<string, { label: string; count: number; sortOrder: number }>;
    }
  >();

  rows.forEach((row) => {
    const group = grouped.get(row.key) ?? {
      label: locale === "it" ? row.label_it : row.label_zh,
      sortOrder: row.attribute_sort_order,
      options: new Map(),
    };
    const current = group.options.get(row.value) ?? {
      label: locale === "it" ? row.value_label_it : row.value_label_zh,
      count: 0,
      sortOrder: row.value_sort_order,
    };
    current.count += 1;
    group.options.set(row.value, current);
    grouped.set(row.key, group);
  });

  return [...grouped.entries()]
    .sort((a, b) => a[1].sortOrder - b[1].sortOrder)
    .map(([key, group]) => ({
      key: `attr_${key}`,
      label: group.label,
      kind: "multi" as const,
      options: [...group.options.entries()]
        .sort((a, b) => a[1].sortOrder - b[1].sortOrder || a[1].label.localeCompare(b[1].label))
        .map(([value, option]) => ({
          value,
          label: option.label,
          count: option.count,
          active: state.attrs[key]?.includes(value) ?? false,
        })),
    }));
}

function buildAvailabilityOptions(
  rows: CatalogRow[],
  active: string,
  locale: Locale,
): CatalogFacetOption[] {
  const labels = {
    in_stock: locale === "it" ? "Disponibile" : "有现货",
    low_stock: locale === "it" ? "Scorte basse" : "低库存",
    incoming: locale === "it" ? "In arrivo" : "在途",
    out_of_stock: locale === "it" ? "Esaurito" : "缺货",
  };

  const counts = rows.reduce<Record<string, number>>(
    (result, row) => {
      const available = Number(row.available_stock ?? 0);
      const incoming = Number(row.incoming_qty ?? 0);
      if (available > 0) result.in_stock += 1;
      if (available > 0 && available <= 10) result.low_stock += 1;
      if (available <= 0 && incoming > 0) result.incoming += 1;
      if (available <= 0 && incoming <= 0) result.out_of_stock += 1;
      return result;
    },
    { in_stock: 0, low_stock: 0, incoming: 0, out_of_stock: 0 },
  );

  return Object.entries(labels)
    .map(([value, label]) => ({ value, label, count: counts[value] ?? 0, active: active === value }))
    .filter((option) => option.count > 0 || option.active);
}

function countOptions(rows: CatalogRow[], key: keyof CatalogRow, active: string) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const value = String(row[key] ?? "");
    if (!value) return;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([value, count]) => ({ value, label: value, count, active: active === value }));
}

function countCategoryOptions(rows: CatalogRow[], locale: Locale, active: string) {
  const counts = new Map<string, { label: string; count: number }>();
  rows.forEach((row) => {
    const value = row.category;
    if (!value) return;
    const current = counts.get(value) ?? {
      label: (locale === "it" ? row.category_name_it : row.category_name_zh) ?? value,
      count: 0,
    };
    current.count += 1;
    counts.set(value, current);
  });

  return [...counts.entries()]
    .sort((a, b) => a[1].label.localeCompare(b[1].label))
    .map(([value, option]) => ({
      value,
      label: option.label,
      count: option.count,
      active: active === value,
    }));
}

function mapCatalogRow(
  row: CatalogRow,
  locale: Locale,
  isPriceVisible: boolean,
): CatalogItem {
  return {
    skuId: row.sku_id,
    productId: row.product_id,
    slug: row.slug,
    sku: row.sku,
    brand: row.brand,
    model: row.model,
    category: row.category,
    categoryLabel: (locale === "it" ? row.category_name_it : row.category_name_zh) ?? row.category,
    quality: row.quality_grade,
    name: locale === "it" ? row.name_it : row.name_zh,
    description:
      (locale === "it" ? row.description_it : row.description_zh) ??
      (locale === "it" ? row.name_it : row.name_zh),
    image: row.image_url ?? null,
    color: row.color ?? null,
    compatibility: row.compatibility ?? [],
    moq: Number(row.moq ?? 1),
    retailPrice: isPriceVisible ? Number(row.retail_price ?? 0) : null,
    b2bPrice: isPriceVisible ? Number(row.b2b_price ?? 0) : null,
    stockOnHand: isPriceVisible ? Number(row.stock_on_hand ?? 0) : null,
    availableStock: isPriceVisible ? Number(row.available_stock ?? 0) : null,
    incomingQty: isPriceVisible ? Number(row.incoming_qty ?? 0) : null,
  };
}

function mapLocalProduct(
  product: Product,
  locale: Locale,
  isPriceVisible: boolean,
): CatalogItem {
  return {
    skuId: product.sku,
    productId: product.slug,
    slug: product.slug,
    sku: product.sku,
    brand: product.brand,
    model: product.model,
    category: product.category,
    categoryLabel: product.category,
    quality: product.quality,
    name: product.names[locale],
    description: product.descriptions[locale],
    image: product.image,
    color: product.color,
    compatibility: product.compatibility,
    moq: product.moq,
    retailPrice: isPriceVisible ? product.retailPrice : null,
    b2bPrice: isPriceVisible ? product.b2bPrice : null,
    stockOnHand: isPriceVisible ? product.stock : null,
    availableStock: isPriceVisible ? product.stock : null,
    incomingQty: isPriceVisible ? (product.incoming ?? 0) : null,
  };
}

function matchesLocalProduct(product: Product, state: CatalogSearchState) {
  const q = sanitizeSearchTerm(state.q);
  const matchesQuery =
    !q ||
    product.sku.toLowerCase().includes(q) ||
    product.brand.toLowerCase().includes(q) ||
    product.model.toLowerCase().includes(q) ||
    product.names.it.toLowerCase().includes(q) ||
    product.names.zh.toLowerCase().includes(q);

  return (
    matchesQuery &&
    (!state.brand || product.brand === state.brand) &&
    (!state.model || product.model === state.model) &&
    (!state.category || product.category === state.category) &&
    (!state.quality || product.quality === state.quality)
  );
}

function sortLocalProducts(
  items: Product[],
  sort: CatalogSort,
  isPriceVisible: boolean,
) {
  return [...items].sort((a, b) => {
    if (sort === "price_asc" && isPriceVisible) return a.b2bPrice - b.b2bPrice;
    if (sort === "price_desc" && isPriceVisible) return b.b2bPrice - a.b2bPrice;
    if (sort === "name_asc") return a.names.it.localeCompare(b.names.it);
    return `${a.brand} ${a.model} ${a.sku}`.localeCompare(`${b.brand} ${b.model} ${b.sku}`);
  });
}

function sanitizeSearchTerm(value: string) {
  return value.toLowerCase().replace(/[%_,]/g, " ").replace(/\s+/g, " ").trim();
}

function isCatalogSort(value: string): value is CatalogSort {
  return ["relevance", "name_asc", "brand_asc", "price_asc", "price_desc"].includes(value);
}

function appendParam(params: URLSearchParams, key: string, value: string) {
  if (value) params.append(key, value);
}

function valueOf(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function valuesOf(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values.map((item) => item.trim()).filter(Boolean);
}
