import type { Locale } from "@/types";

type LocalizedText = Record<Locale, string>;

export type HomeCategory = {
  id: string;
  slug: string;
  icon: "screen" | "battery" | "port" | "camera" | "cable" | "tool";
  name: LocalizedText;
  count: string;
};

export type HomeProduct = {
  id: string;
  sku: string;
  name: LocalizedText;
  brand: string;
  quality: "A+" | "A" | "B";
  price: string;
  stock: number;
  visual: "screen" | "battery" | "port" | "camera";
};

export type HomeBrand = {
  id: string;
  name: string;
  accent: string;
};

export const homeCategories: HomeCategory[] = [
  {
    id: "screens",
    slug: "screens",
    icon: "screen",
    name: {
      it: "Schermi",
      en: "Screens",
      zh: "屏幕总成",
    },
    count: "1,240",
  },
  {
    id: "batteries",
    slug: "batteries",
    icon: "battery",
    name: {
      it: "Batterie",
      en: "Batteries",
      zh: "电池",
    },
    count: "680",
  },
  {
    id: "charging-ports",
    slug: "charging-ports",
    icon: "port",
    name: {
      it: "Connettori",
      en: "Ports",
      zh: "充电接口",
    },
    count: "430",
  },
  {
    id: "cameras",
    slug: "cameras",
    icon: "camera",
    name: {
      it: "Fotocamere",
      en: "Cameras",
      zh: "摄像头",
    },
    count: "390",
  },
  {
    id: "flex-cables",
    slug: "flex-cables",
    icon: "cable",
    name: {
      it: "Flex",
      en: "Flex",
      zh: "排线",
    },
    count: "510",
  },
  {
    id: "tools",
    slug: "tools",
    icon: "tool",
    name: {
      it: "Strumenti",
      en: "Tools",
      zh: "工具",
    },
    count: "220",
  },
];

export const homeProducts: HomeProduct[] = [
  {
    id: "ip11-display-soft",
    sku: "IP11-SCR-SOFT-BLK",
    name: {
      it: "Display iPhone 11 con frame",
      en: "iPhone 11 display with frame",
      zh: "iPhone 11 带框屏幕",
    },
    brand: "Apple",
    quality: "A+",
    price: "€45,90",
    stock: 120,
    visual: "screen",
  },
  {
    id: "ip12-battery",
    sku: "IP12-BAT-HQ",
    name: {
      it: "Batteria iPhone 12 alta capacita",
      en: "iPhone 12 high-capacity battery",
      zh: "iPhone 12 高容量电池",
    },
    brand: "Apple",
    quality: "A",
    price: "€28,50",
    stock: 60,
    visual: "battery",
  },
  {
    id: "sa52-port",
    sku: "SA52-CHG-EU",
    name: {
      it: "Connettore ricarica Galaxy A52",
      en: "Galaxy A52 charging port",
      zh: "Galaxy A52 充电接口",
    },
    brand: "Samsung",
    quality: "A+",
    price: "€12,90",
    stock: 35,
    visual: "port",
  },
  {
    id: "ip13-camera",
    sku: "IP13-CAM-REAR",
    name: {
      it: "Fotocamera posteriore iPhone 13",
      en: "iPhone 13 rear camera",
      zh: "iPhone 13 后置摄像头",
    },
    brand: "Apple",
    quality: "B",
    price: "€19,90",
    stock: 18,
    visual: "camera",
  },
];

export const homeBrands: HomeBrand[] = [
  { id: "apple", name: "Apple", accent: "#111827" },
  { id: "samsung", name: "Samsung", accent: "#2563EB" },
  { id: "xiaomi", name: "Xiaomi", accent: "#F97316" },
  { id: "oppo", name: "OPPO", accent: "#16A34A" },
  { id: "huawei", name: "Huawei", accent: "#DC2626" },
  { id: "oneplus", name: "OnePlus", accent: "#EF4444" },
];

export const homeMetrics = [
  {
    id: "sku",
    value: "10,000+",
    label: {
      it: "SKU attivi",
      en: "Active SKU",
      zh: "现货 SKU",
    },
  },
  {
    id: "speed",
    value: "24h",
    label: {
      it: "preparazione rapida",
      en: "fast dispatch",
      zh: "快速发货",
    },
  },
  {
    id: "coverage",
    value: "99.8%",
    label: {
      it: "ordini tracciati",
      en: "tracked orders",
      zh: "订单可追踪",
    },
  },
];
