import type { Locale } from "@/lib/i18n";

export type ProductStatus = "in_stock" | "low_stock" | "out_of_stock" | "incoming";

export type QualityGrade =
  | "Original Pull"
  | "Refurbished Original"
  | "Service Pack"
  | "Soft OLED"
  | "Hard OLED"
  | "TFT / Incell"
  | "High Quality Compatible"
  | "Clearance";

export type Product = {
  slug: string;
  sku: string;
  brand: string;
  model: string;
  category: string;
  quality: QualityGrade;
  color: string;
  image: string;
  stock: number;
  incoming?: number;
  moq: number;
  retailPrice: number;
  b2bPrice: number;
  vatRate: number;
  names: Record<Locale, string>;
  descriptions: Record<Locale, string>;
  compatibility: string[];
  tiers: Array<{ minQty: number; unitPrice: number }>;
};

export const categories = [
  { id: "screens", label: { it: "Display", zh: "屏幕" } },
  { id: "batteries", label: { it: "Batterie", zh: "电池" } },
  { id: "charging-ports", label: { it: "Connettori ricarica", zh: "尾插" } },
  { id: "dock-connectors", label: { it: "Dock connector", zh: "尾插 / 充电接口" } },
  { id: "back-covers", label: { it: "Back cover", zh: "后盖" } },
  { id: "cameras", label: { it: "Fotocamere", zh: "摄像头" } },
  { id: "tools", label: { it: "Strumenti", zh: "工具耗材" } },
];

export const qualityStyles: Record<QualityGrade, string> = {
  "Original Pull": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Refurbished Original": "border-blue-200 bg-blue-50 text-blue-700",
  "Service Pack": "border-slate-300 bg-slate-100 text-slate-800",
  "Soft OLED": "border-violet-200 bg-violet-50 text-violet-700",
  "Hard OLED": "border-indigo-200 bg-indigo-50 text-indigo-700",
  "TFT / Incell": "border-orange-200 bg-orange-50 text-orange-700",
  "High Quality Compatible": "border-cyan-200 bg-cyan-50 text-cyan-700",
  Clearance: "border-rose-200 bg-rose-50 text-rose-700",
};

export const products: Product[] = [
  {
    slug: "iphone-14-soft-oled-display-black",
    sku: "APL-IP14-SCR-SO-BLK",
    brand: "Apple",
    model: "iPhone 14",
    category: "screens",
    quality: "Soft OLED",
    color: "Black",
    image:
      "https://images.unsplash.com/photo-1581993192008-63e896f4f744?auto=format&fit=crop&w=900&q=80",
    stock: 42,
    incoming: 80,
    moq: 1,
    retailPrice: 89.9,
    b2bPrice: 68.5,
    vatRate: 0.22,
    names: {
      it: "Display iPhone 14 Soft OLED nero",
      zh: "iPhone 14 Soft OLED 黑色屏幕",
    },
    descriptions: {
      it: "Display compatibile Soft OLED con touch testato e frame-ready workflow per laboratori.",
      zh: "兼容 Soft OLED 屏幕，适合维修店稳定采购，安装前需测试显示与触控。",
    },
    compatibility: ["iPhone 14", "A2649", "A2881", "A2882"],
    tiers: [
      { minQty: 5, unitPrice: 65.2 },
      { minQty: 10, unitPrice: 62.9 },
      { minQty: 25, unitPrice: 60.5 },
    ],
  },
  {
    slug: "iphone-13-battery-high-quality",
    sku: "APL-IP13-BAT-HQ",
    brand: "Apple",
    model: "iPhone 13",
    category: "batteries",
    quality: "High Quality Compatible",
    color: "Black",
    image:
      "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80",
    stock: 18,
    incoming: 120,
    moq: 2,
    retailPrice: 24.9,
    b2bPrice: 16.4,
    vatRate: 0.22,
    names: {
      it: "Batteria iPhone 13 alta qualita",
      zh: "iPhone 13 高品质兼容电池",
    },
    descriptions: {
      it: "Batteria compatibile con adesivi consigliati e note di trasporto litio incluse.",
      zh: "兼容电池，适合搭配电池胶销售，退货和运输需遵守锂电安全规则。",
    },
    compatibility: ["iPhone 13", "A2482", "A2631", "A2633"],
    tiers: [
      { minQty: 10, unitPrice: 15.6 },
      { minQty: 25, unitPrice: 14.8 },
      { minQty: 50, unitPrice: 13.9 },
    ],
  },
  {
    slug: "galaxy-a52-service-pack-display",
    sku: "SAM-A52-SCR-SP-BLK",
    brand: "Samsung",
    model: "Galaxy A52",
    category: "screens",
    quality: "Service Pack",
    color: "Black",
    image:
      "https://images.unsplash.com/photo-1606041011872-596597976b25?auto=format&fit=crop&w=900&q=80",
    stock: 9,
    moq: 1,
    retailPrice: 109,
    b2bPrice: 86,
    vatRate: 0.22,
    names: {
      it: "Display Samsung Galaxy A52 Service Pack",
      zh: "Samsung Galaxy A52 Service Pack 屏幕",
    },
    descriptions: {
      it: "Ricambio Service Pack per riparazioni dove priorita sono resa e qualita costante.",
      zh: "Service Pack 等级配件，适合要求稳定显示效果和低售后的维修场景。",
    },
    compatibility: ["Galaxy A52", "SM-A525F", "SM-A526B"],
    tiers: [
      { minQty: 3, unitPrice: 83 },
      { minQty: 8, unitPrice: 79 },
    ],
  },
  {
    slug: "redmi-note-11-charging-port-flex",
    sku: "XIA-RN11-CHG-FLX",
    brand: "Xiaomi",
    model: "Redmi Note 11",
    category: "charging-ports",
    quality: "High Quality Compatible",
    color: "Black",
    image:
      "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&w=900&q=80",
    stock: 64,
    moq: 5,
    retailPrice: 9.9,
    b2bPrice: 4.8,
    vatRate: 0.22,
    names: {
      it: "Flex connettore ricarica Redmi Note 11",
      zh: "Redmi Note 11 尾插排线",
    },
    descriptions: {
      it: "Modulo flex per ricarica, microfono e connessione USB-C, controllare variante modello.",
      zh: "USB-C 尾插排线，含充电接口相关功能，请下单前确认机型版本。",
    },
    compatibility: ["Redmi Note 11", "2201117TG", "2201117TY"],
    tiers: [
      { minQty: 10, unitPrice: 4.4 },
      { minQty: 30, unitPrice: 3.9 },
    ],
  },
  {
    slug: "iphone-12-back-cover-blue",
    sku: "APL-IP12-BCV-BLU",
    brand: "Apple",
    model: "iPhone 12",
    category: "back-covers",
    quality: "Refurbished Original",
    color: "Blue",
    image:
      "https://images.unsplash.com/photo-1604671368394-2240d0b1bb6c?auto=format&fit=crop&w=900&q=80",
    stock: 0,
    incoming: 40,
    moq: 1,
    retailPrice: 38,
    b2bPrice: 25.5,
    vatRate: 0.22,
    names: {
      it: "Back cover iPhone 12 blu ricondizionato",
      zh: "iPhone 12 蓝色后盖翻新原装等级",
    },
    descriptions: {
      it: "Scocca posteriore per riparazioni estetiche, verificare colore e frame prima del montaggio.",
      zh: "用于外观维修的后盖配件，请在安装前确认颜色、边框和摄像头孔位。",
    },
    compatibility: ["iPhone 12", "A2172", "A2402", "A2403"],
    tiers: [
      { minQty: 5, unitPrice: 24 },
      { minQty: 15, unitPrice: 22.5 },
    ],
  },
  {
    slug: "repair-tool-starter-kit",
    sku: "TLS-STARTER-KIT",
    brand: "Tools",
    model: "Universal",
    category: "tools",
    quality: "High Quality Compatible",
    color: "Mixed",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80",
    stock: 27,
    moq: 1,
    retailPrice: 34.9,
    b2bPrice: 22.9,
    vatRate: 0.22,
    names: {
      it: "Kit strumenti riparazione smartphone",
      zh: "手机维修工具入门套装",
    },
    descriptions: {
      it: "Set per apertura, viti, spudger e adesivi, utile per aumentare valore medio ordine.",
      zh: "包含拆机、螺丝刀、撬棒和耗材，适合与屏幕、电池配套销售。",
    },
    compatibility: ["iPhone", "Samsung", "Xiaomi", "Oppo"],
    tiers: [
      { minQty: 5, unitPrice: 21.4 },
      { minQty: 12, unitPrice: 19.8 },
    ],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductStatus(product: Product): ProductStatus {
  if (product.stock <= 0 && product.incoming) return "incoming";
  if (product.stock <= 0) return "out_of_stock";
  if (product.stock < 12) return "low_stock";
  return "in_stock";
}

export function getCategoryLabel(categoryId: string, locale: Locale) {
  return (
    categories.find((category) => category.id === categoryId)?.label[locale] ??
    categoryId
  );
}

export const brands = Array.from(new Set(products.map((product) => product.brand)));
export const models = Array.from(new Set(products.map((product) => product.model)));
