import type { Locale, QualityGrade } from "@/types";

export type CatalogVisual = "screen" | "battery" | "port" | "camera";

type LocalizedText = Record<Locale, string>;

export type CatalogCategory = {
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
};

export type CatalogBrand = {
  slug: string;
  name: string;
};

export type CatalogProduct = {
  slug: string;
  brandSlug: string;
  categorySlug: string;
  name: LocalizedText;
  description: LocalizedText;
  modelCodes: string[];
  visual: CatalogVisual;
  skus: CatalogSku[];
};

export type CatalogSku = {
  id: string;
  slug: string;
  sku: string;
  productSlug: string;
  quality: QualityGrade;
  color: string | null;
  frameType: "with_frame" | "without_frame" | null;
  price: number;
  priceLabel: string;
  stock: number;
  moq: number;
};

export type CatalogSkuView = CatalogSku & {
  brand: CatalogBrand;
  category: CatalogCategory;
  product: CatalogProduct;
};

export const catalogCategories: CatalogCategory[] = [
  {
    slug: "screens",
    name: {
      it: "Schermi",
      en: "Screens",
      zh: "屏幕总成",
    },
    description: {
      it: "Display completi e varianti con frame.",
      en: "Display assemblies and frame variants.",
      zh: "屏幕总成与带框版本。",
    },
  },
  {
    slug: "batteries",
    name: {
      it: "Batterie",
      en: "Batteries",
      zh: "电池",
    },
    description: {
      it: "Batterie testate per riparazioni rapide.",
      en: "Tested batteries for quick repairs.",
      zh: "适合快速维修的测试电池。",
    },
  },
  {
    slug: "charging-ports",
    name: {
      it: "Connettori di ricarica",
      en: "Charging Ports",
      zh: "充电接口",
    },
    description: {
      it: "Dock, flex e connettori per modelli EU.",
      en: "Dock, flex, and charging connectors.",
      zh: "尾插、排线与充电接口。",
    },
  },
  {
    slug: "cameras",
    name: {
      it: "Fotocamere",
      en: "Cameras",
      zh: "摄像头",
    },
    description: {
      it: "Moduli camera posteriori e frontali.",
      en: "Rear and front camera modules.",
      zh: "前后置摄像头模组。",
    },
  },
  {
    slug: "flex-cables",
    name: {
      it: "Flex",
      en: "Flex Cables",
      zh: "排线",
    },
    description: {
      it: "Flex interni per segnali, tasti e sensori.",
      en: "Internal flex cables for signals, buttons, and sensors.",
      zh: "信号、按键与传感器排线。",
    },
  },
  {
    slug: "tools",
    name: {
      it: "Strumenti",
      en: "Tools",
      zh: "工具",
    },
    description: {
      it: "Utensili compatti per laboratorio.",
      en: "Compact repair shop tools.",
      zh: "维修工作台工具。",
    },
  },
];

export const catalogBrands: CatalogBrand[] = [
  { slug: "apple", name: "Apple" },
  { slug: "samsung", name: "Samsung" },
  { slug: "xiaomi", name: "Xiaomi" },
  { slug: "oppo", name: "OPPO" },
  { slug: "huawei", name: "Huawei" },
  { slug: "honor", name: "Honor" },
  { slug: "realme", name: "Realme" },
  { slug: "motorola", name: "Motorola" },
  { slug: "oneplus", name: "OnePlus" },
];

export const catalogProducts: CatalogProduct[] = [
  {
    slug: "iphone-11-display",
    brandSlug: "apple",
    categorySlug: "screens",
    name: {
      it: "Display iPhone 11",
      en: "iPhone 11 Display",
      zh: "iPhone 11 屏幕总成",
    },
    description: {
      it: "Display di ricambio per iPhone 11 con varianti qualita e frame.",
      en: "Replacement display for iPhone 11 with quality and frame variants.",
      zh: "iPhone 11 维修屏幕总成，包含不同质量和带框版本。",
    },
    modelCodes: ["A2111", "A2221", "A2223"],
    visual: "screen",
    skus: [
      {
        id: "ip11-screen-soft",
        slug: "ip11-scr-soft-blk",
        sku: "IP11-SCR-SOFT-BLK",
        productSlug: "iphone-11-display",
        quality: "A+",
        color: "Black",
        frameType: "with_frame",
        price: 45.9,
        priceLabel: "€45,90",
        stock: 120,
        moq: 1,
      },
      {
        id: "ip11-screen-hard",
        slug: "ip11-scr-hard-blk",
        sku: "IP11-SCR-HARD-BLK",
        productSlug: "iphone-11-display",
        quality: "A",
        color: "Black",
        frameType: "with_frame",
        price: 39.9,
        priceLabel: "€39,90",
        stock: 80,
        moq: 1,
      },
      {
        id: "ip11-screen-tft",
        slug: "ip11-scr-tft-blk",
        sku: "IP11-SCR-TFT-BLK",
        productSlug: "iphone-11-display",
        quality: "B",
        color: "Black",
        frameType: "with_frame",
        price: 29.9,
        priceLabel: "€29,90",
        stock: 200,
        moq: 1,
      },
    ],
  },
  {
    slug: "iphone-12-battery",
    brandSlug: "apple",
    categorySlug: "batteries",
    name: {
      it: "Batteria iPhone 12",
      en: "iPhone 12 Battery",
      zh: "iPhone 12 电池",
    },
    description: {
      it: "Batteria alta capacita per iPhone 12, pronta per laboratorio.",
      en: "High-capacity battery for iPhone 12, ready for repair shops.",
      zh: "iPhone 12 高容量维修电池。",
    },
    modelCodes: ["A2172", "A2402", "A2403"],
    visual: "battery",
    skus: [
      {
        id: "ip12-battery-hq",
        slug: "ip12-bat-hq",
        sku: "IP12-BAT-HQ",
        productSlug: "iphone-12-battery",
        quality: "A",
        color: null,
        frameType: null,
        price: 28.5,
        priceLabel: "€28,50",
        stock: 60,
        moq: 1,
      },
    ],
  },
  {
    slug: "galaxy-a52-charging-port",
    brandSlug: "samsung",
    categorySlug: "charging-ports",
    name: {
      it: "Connettore ricarica Galaxy A52",
      en: "Galaxy A52 Charging Port",
      zh: "Galaxy A52 充电接口",
    },
    description: {
      it: "Connettore di ricarica EU per Samsung Galaxy A52.",
      en: "EU charging port for Samsung Galaxy A52.",
      zh: "Samsung Galaxy A52 欧版充电接口。",
    },
    modelCodes: ["SM-A525F"],
    visual: "port",
    skus: [
      {
        id: "sa52-charging-eu",
        slug: "sa52-chg-eu",
        sku: "SA52-CHG-EU",
        productSlug: "galaxy-a52-charging-port",
        quality: "A+",
        color: null,
        frameType: null,
        price: 12.9,
        priceLabel: "€12,90",
        stock: 35,
        moq: 1,
      },
    ],
  },
  {
    slug: "iphone-13-rear-camera",
    brandSlug: "apple",
    categorySlug: "cameras",
    name: {
      it: "Fotocamera posteriore iPhone 13",
      en: "iPhone 13 Rear Camera",
      zh: "iPhone 13 后置摄像头",
    },
    description: {
      it: "Modulo fotocamera posteriore per iPhone 13.",
      en: "Rear camera module for iPhone 13.",
      zh: "iPhone 13 后置摄像头维修模组。",
    },
    modelCodes: ["A2482", "A2631", "A2633"],
    visual: "camera",
    skus: [
      {
        id: "ip13-camera-rear",
        slug: "ip13-cam-rear",
        sku: "IP13-CAM-REAR",
        productSlug: "iphone-13-rear-camera",
        quality: "B",
        color: null,
        frameType: null,
        price: 19.9,
        priceLabel: "€19,90",
        stock: 18,
        moq: 1,
      },
    ],
  },
];

const defaultCatalogBrand = catalogBrands[0] ?? { slug: "unknown", name: "Unknown" };
const defaultCatalogCategory = catalogCategories[0] ?? {
  slug: "unknown",
  name: {
    it: "Sconosciuto",
    en: "Unknown",
    zh: "未知",
  },
  description: {
    it: "Categoria non configurata.",
    en: "Category not configured.",
    zh: "分类未配置。",
  },
};

export const catalogSkus = catalogProducts.flatMap((product) =>
  product.skus.map<CatalogSkuView>((sku) => ({
    ...sku,
    brand: getBrandBySlug(product.brandSlug) ?? defaultCatalogBrand,
    category: getCategoryBySlug(product.categorySlug) ?? defaultCatalogCategory,
    product,
  })),
);

export function getBrandBySlug(slug: string) {
  return catalogBrands.find((brand) => brand.slug === slug);
}

export function getCategoryBySlug(slug: string) {
  return catalogCategories.find((category) => category.slug === slug);
}

export function getProductBySlug(slug: string) {
  return catalogProducts.find((product) => product.slug === slug);
}

export function getSkuBySlug(slug: string) {
  return catalogSkus.find((sku) => sku.slug === slug);
}

export function getSkusByProduct(productSlug: string) {
  return catalogSkus.filter((sku) => sku.productSlug === productSlug);
}

export function filterCatalogSkus(filters: {
  brandSlug?: string;
  categorySlug?: string;
  query?: string;
  quality?: string;
}) {
  const normalizedQuery = filters.query?.trim().toLowerCase();

  return catalogSkus.filter((sku) => {
    if (filters.brandSlug && sku.brand.slug !== filters.brandSlug) {
      return false;
    }

    if (filters.categorySlug && sku.category.slug !== filters.categorySlug) {
      return false;
    }

    if (filters.quality && sku.quality !== filters.quality) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchText = [
      sku.sku,
      sku.brand.name,
      sku.product.name.it,
      sku.product.name.en,
      sku.product.name.zh,
      sku.product.modelCodes.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return searchText.includes(normalizedQuery);
  });
}
