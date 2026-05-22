import type { Product } from '@/types/product'
import { hasSupabaseConfig, shouldUseSupabaseData, supabase } from '@/lib/supabase'

type ProductRow = {
  sku_code: string
  name: string
  brand: string
  model: string
  model_codes: string[] | null
  category: string
  quality_grade: string
  color: string
  frame: Product['frame']
  stock_status: Product['stockStatus']
  image_path?: string | null
  image_alt?: string | null
  gallery_image_paths?: string[] | null
  moq: number
  b2b_price?: number | null
  vat_mode: Product['vatMode']
  warranty_days: number
  compatibility: Product['compatibility'] | null
  highlights: string[] | null
}

const publicProductColumns =
  'sku_code,name,brand,model,model_codes,category,quality_grade,color,frame,stock_status,image_path,image_alt,gallery_image_paths,moq,vat_mode,warranty_days,compatibility,highlights'

const authenticatedProductColumns = `${publicProductColumns},b2b_price`
const productImageBucket = 'product-images'

function slugifyProductText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getProductSlug(product: Product) {
  return slugifyProductText(`${product.brand} ${product.model} ${product.category} ${product.qualityGrade} ${product.color}`)
}

export function getProductRoutePath(product: Product) {
  return `/products/${getProductSlug(product)}`
}

export function getProductImageUrl(imagePath?: string | null) {
  const normalizedPath = imagePath?.trim()

  if (!normalizedPath) {
    return ''
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath
  }

  if (!hasSupabaseConfig) {
    return ''
  }

  const { data } = supabase.storage.from(productImageBucket).getPublicUrl(normalizedPath)
  return data.publicUrl
}

export function resolveProductImageUrl(product: Product) {
  return product.imageUrl || getProductImageUrl(product.imagePath)
}

const products: Product[] = [
  {
    skuCode: 'IP11-SCR-SOFT-BLK',
    name: 'iPhone 11 Display Soft OLED Black Without Frame',
    brand: 'Apple',
    model: 'iPhone 11',
    modelCodes: ['A2111', 'A2221', 'A2223'],
    category: 'Screens',
    qualityGrade: 'Soft OLED',
    color: 'Black',
    frame: 'Without Frame',
    stockStatus: 'in_stock',
    imagePath: 'screens/IP11-SCR-SOFT-BLK.webp',
    imageAlt: 'iPhone 11 display Soft OLED black without frame',
    moq: 1,
    b2bPrice: 32,
    vatMode: 'IVA esclusa',
    warrantyDays: 180,
    compatibility: [
      { model: 'iPhone 11', code: 'A2111 / A2221 / A2223', note: 'Compatibile' },
      { model: 'iPhone 11 Pro', code: 'A2160 / A2215', note: 'Non compatibile' },
    ],
    highlights: ['Test before installation', 'B2B price after login', 'RMA tracciabile'],
  },
  {
    skuCode: 'IP12-BAT-HQ-2815',
    name: 'iPhone 12 Battery 2815mAh Compatible High Quality',
    brand: 'Apple',
    model: 'iPhone 12',
    modelCodes: ['A2172', 'A2402', 'A2403'],
    category: 'Batteries',
    qualityGrade: 'High Quality Compatible',
    color: 'Black',
    frame: 'N/A',
    stockStatus: 'low_stock',
    imagePath: 'batteries/IP12-BAT-HQ-2815.webp',
    imageAlt: 'iPhone 12 compatible high quality battery',
    moq: 1,
    b2bPrice: 14.5,
    vatMode: 'IVA esclusa',
    warrantyDays: 180,
    compatibility: [
      { model: 'iPhone 12', code: 'A2172 / A2402 / A2403', note: 'Verificare connettore' },
    ],
    highlights: ['Battery safety notice', 'MSDS/UN38.3 required', 'Low stock'],
  },
  {
    skuCode: 'SA52-CHG-EU-BLK',
    name: 'Samsung Galaxy A52 Charging Port Flex EU Version',
    brand: 'Samsung',
    model: 'Galaxy A52',
    modelCodes: ['SM-A525F', 'SM-A526B'],
    category: 'Charging Ports',
    qualityGrade: 'Compatible High Quality',
    color: 'Black',
    frame: 'N/A',
    stockStatus: 'in_stock',
    imagePath: 'charging-ports/SA52-CHG-EU-BLK.webp',
    imageAlt: 'Samsung Galaxy A52 charging port flex EU version',
    moq: 2,
    b2bPrice: 5.9,
    vatMode: 'IVA esclusa',
    warrantyDays: 120,
    compatibility: [
      { model: 'Galaxy A52', code: 'SM-A525F', note: 'EU version' },
      { model: 'Galaxy A52 5G', code: 'SM-A526B', note: 'Verificare versione' },
    ],
    highlights: ['EU version', 'MOQ 2', 'Fast dispatch'],
  },
  {
    skuCode: 'RN10-BKC-BLU',
    name: 'Xiaomi Redmi Note 10 Back Cover Blue',
    brand: 'Xiaomi',
    model: 'Redmi Note 10',
    modelCodes: ['M2101K7AG'],
    category: 'Back Covers',
    qualityGrade: 'Compatible High Quality',
    color: 'Blue',
    frame: 'N/A',
    stockStatus: 'incoming',
    imagePath: 'back-covers/RN10-BKC-BLU.webp',
    imageAlt: 'Xiaomi Redmi Note 10 blue back cover',
    moq: 1,
    b2bPrice: 7.8,
    vatMode: 'IVA esclusa',
    warrantyDays: 90,
    compatibility: [
      { model: 'Redmi Note 10', code: 'M2101K7AG', note: 'Blue version' },
    ],
    highlights: ['Incoming stock', 'Color matched', 'B2B reserved price'],
  },
  {
    skuCode: 'IP13-CAM-REAR',
    name: 'iPhone 13 Rear Camera Compatible Module',
    brand: 'Apple',
    model: 'iPhone 13',
    modelCodes: ['A2482', 'A2631', 'A2633'],
    category: 'Cameras',
    qualityGrade: 'Refurbished Original',
    color: 'Black',
    frame: 'N/A',
    stockStatus: 'out_of_stock',
    imagePath: 'cameras/IP13-CAM-REAR.webp',
    imageAlt: 'iPhone 13 rear camera compatible module',
    moq: 1,
    b2bPrice: 38,
    vatMode: 'IVA esclusa',
    warrantyDays: 120,
    compatibility: [
      { model: 'iPhone 13', code: 'A2482 / A2631 / A2633', note: 'Verificare iOS warning' },
    ],
    highlights: ['Out of stock', 'Alternative SKU recommended', 'RMA rules apply'],
  },
  {
    skuCode: 'TOOL-WATERPROOF-SET',
    name: 'Waterproof Adhesive Set for iPhone 11/12 Series',
    brand: 'PartsPro',
    model: 'iPhone 11/12 Series',
    modelCodes: ['Universal'],
    category: 'Tools',
    qualityGrade: 'Consumable',
    color: 'Mixed',
    frame: 'N/A',
    stockStatus: 'in_stock',
    imagePath: 'tools/TOOL-WATERPROOF-SET.webp',
    imageAlt: 'Waterproof adhesive set for iPhone 11 and 12 series',
    moq: 5,
    b2bPrice: 1.2,
    vatMode: 'IVA esclusa',
    warrantyDays: 30,
    compatibility: [
      { model: 'iPhone 11/12 Series', code: 'Universal', note: 'Scegliere modello corretto' },
    ],
    highlights: ['Add-on item', 'MOQ 5', 'Recommended with screens'],
  },
]

export function getProducts() {
  return products
}

export function getProductBySku(skuCode: string) {
  return products.find((product) => product.skuCode.toLowerCase() === skuCode.toLowerCase())
}

export function getProductBySlug(slug: string) {
  return products.find((product) => getProductSlug(product) === slug.toLowerCase())
}

export function searchProducts(query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return products
  }

  return products.filter((product) => {
    const haystack = [
      product.name,
      product.skuCode,
      product.brand,
      product.model,
      product.category,
      product.qualityGrade,
      product.color,
      ...product.modelCodes,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedQuery)
  })
}

function mapProductRow(row: ProductRow): Product {
  return {
    skuCode: row.sku_code,
    name: row.name,
    brand: row.brand,
    model: row.model,
    modelCodes: row.model_codes || [],
    category: row.category,
    qualityGrade: row.quality_grade,
    color: row.color,
    frame: row.frame,
    stockStatus: row.stock_status,
    imagePath: row.image_path || '',
    imageUrl: getProductImageUrl(row.image_path),
    imageAlt: row.image_alt || row.name,
    galleryImagePaths: row.gallery_image_paths || [],
    moq: row.moq,
    b2bPrice: Number(row.b2b_price || 0),
    vatMode: row.vat_mode,
    warrantyDays: row.warranty_days,
    compatibility: row.compatibility || [],
    highlights: row.highlights || [],
  }
}

async function getProductColumns() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session ? authenticatedProductColumns : publicProductColumns
}

function warnSupabaseFallback(scope: string, error: unknown) {
  console.warn(`[PartsPro] Supabase ${scope} fallback to mock data`, error)
}

export async function fetchProducts() {
  if (!shouldUseSupabaseData) {
    return getProducts()
  }

  try {
    const columns = await getProductColumns()
    const { data, error } = await supabase
      .from('products')
      .select(columns as string)
      .eq('status', 'active')
      .order('brand', { ascending: true })
      .order('model', { ascending: true })

    if (error) {
      throw error
    }

    return (data as unknown as ProductRow[]).map((row) => mapProductRow(row))
  } catch (error) {
    warnSupabaseFallback('products', error)
    return getProducts()
  }
}

export async function fetchProductBySku(skuCode: string) {
  if (!shouldUseSupabaseData) {
    return getProductBySku(skuCode)
  }

  try {
    const columns = await getProductColumns()
    const { data, error } = await supabase
      .from('products')
      .select(columns as string)
      .eq('sku_code', skuCode)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data ? mapProductRow(data as unknown as ProductRow) : undefined
  } catch (error) {
    warnSupabaseFallback('product detail', error)
    return getProductBySku(skuCode)
  }
}

export async function fetchProductByRef(productRef: string) {
  const normalizedRef = productRef.trim()

  if (!normalizedRef) {
    return undefined
  }

  const localProduct = getProductBySku(normalizedRef) || getProductBySlug(normalizedRef)

  if (localProduct) {
    return localProduct
  }

  if (/^[A-Z0-9-]+$/i.test(normalizedRef)) {
    const productBySku = await fetchProductBySku(normalizedRef)

    if (productBySku) {
      return productBySku
    }
  }

  const allProducts = await fetchProducts()
  return allProducts.find((product) => getProductSlug(product) === normalizedRef.toLowerCase())
}
