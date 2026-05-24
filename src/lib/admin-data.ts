export type AdminMetric = {
  id: string;
  value: string;
  change: string;
  tone: "primary" | "success" | "warning" | "info";
};

export type AdminChartPoint = {
  label: string;
  value: number;
};

export type AdminStatusPoint = {
  id: string;
  value: number;
  color: string;
};

export type AdminProductRow = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  quality: "A+" | "A" | "B" | "C";
  stock: number;
  price: string;
  status: "active" | "draft" | "low_stock";
  updatedAt: string;
};

export type AdminOrderRow = {
  id: string;
  customer: string;
  total: string;
  items: number;
  status: "new" | "paid" | "processing" | "shipped";
  payment: "paid" | "pending";
  createdAt: string;
};

export type AdminCustomerRow = {
  id: string;
  name: string;
  email: string;
  type: "retail" | "b2b";
  status: "pending" | "approved" | "suspended";
  orders: number;
  revenue: string;
};

export type AdminInventoryRow = {
  id: string;
  sku: string;
  location: string;
  available: number;
  reserved: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  updatedAt: string;
};

export const adminMetrics: AdminMetric[] = [
  {
    id: "orders",
    value: "128",
    change: "+12.5%",
    tone: "primary",
  },
  {
    id: "revenue",
    value: "€12,450",
    change: "+8.2%",
    tone: "success",
  },
  {
    id: "customers",
    value: "856",
    change: "+15.2%",
    tone: "info",
  },
  {
    id: "sku",
    value: "3,251",
    change: "-5.7%",
    tone: "warning",
  },
];

export const salesTrend: AdminChartPoint[] = [
  { label: "05-12", value: 1200 },
  { label: "05-13", value: 2400 },
  { label: "05-14", value: 3100 },
  { label: "05-15", value: 2800 },
  { label: "05-16", value: 4200 },
  { label: "05-17", value: 3600 },
  { label: "05-18", value: 5200 },
];

export const orderStatusDistribution: AdminStatusPoint[] = [
  { id: "paid", value: 42, color: "bg-primary" },
  { id: "processing", value: 28, color: "bg-cyan" },
  { id: "shipped", value: 20, color: "bg-success" },
  { id: "new", value: 10, color: "bg-warning" },
];

export const inventoryDistribution: AdminStatusPoint[] = [
  { id: "in_stock", value: 68, color: "bg-success" },
  { id: "low_stock", value: 18, color: "bg-warning" },
  { id: "out_of_stock", value: 14, color: "bg-danger" },
];

export const adminProducts: AdminProductRow[] = [
  {
    id: "p-001",
    sku: "IP11-SCR-SOFT-BLK",
    name: "Display iPhone 11 con frame",
    brand: "Apple",
    quality: "A+",
    stock: 120,
    price: "€45,90",
    status: "active",
    updatedAt: "2026-05-18 10:30",
  },
  {
    id: "p-002",
    sku: "IP11-SCR-HARD-BLK",
    name: "Display iPhone 11 hard OLED",
    brand: "Apple",
    quality: "A",
    stock: 80,
    price: "€39,90",
    status: "active",
    updatedAt: "2026-05-18 10:20",
  },
  {
    id: "p-003",
    sku: "IP12-BAT-HQ",
    name: "Batteria iPhone 12 alta capacita",
    brand: "Apple",
    quality: "A",
    stock: 60,
    price: "€28,50",
    status: "active",
    updatedAt: "2026-05-18 09:40",
  },
  {
    id: "p-004",
    sku: "SA52-CHG-EU",
    name: "Connettore ricarica Galaxy A52",
    brand: "Samsung",
    quality: "A+",
    stock: 35,
    price: "€12,90",
    status: "low_stock",
    updatedAt: "2026-05-17 16:45",
  },
  {
    id: "p-005",
    sku: "IP13-CAM-REAR",
    name: "Fotocamera posteriore iPhone 13",
    brand: "Apple",
    quality: "B",
    stock: 18,
    price: "€19,90",
    status: "low_stock",
    updatedAt: "2026-05-17 14:12",
  },
  {
    id: "p-006",
    sku: "XM12-LCD-OEM",
    name: "Display Xiaomi 12 OEM",
    brand: "Xiaomi",
    quality: "A",
    stock: 0,
    price: "€34,90",
    status: "draft",
    updatedAt: "2026-05-16 12:05",
  },
];

export const adminOrders: AdminOrderRow[] = [
  {
    id: "ORD-2026-0567",
    customer: "TechFirenze Srl",
    total: "€137,70",
    items: 6,
    status: "new",
    payment: "pending",
    createdAt: "2026-05-18 11:20",
  },
  {
    id: "ORD-2026-0566",
    customer: "MobileFix Roma",
    total: "€80,50",
    items: 3,
    status: "paid",
    payment: "paid",
    createdAt: "2026-05-18 10:02",
  },
  {
    id: "ORD-2026-0565",
    customer: "Repair Lab Milano",
    total: "€245,90",
    items: 11,
    status: "processing",
    payment: "paid",
    createdAt: "2026-05-17 17:45",
  },
  {
    id: "ORD-2026-0564",
    customer: "Centro Assistenza Torino",
    total: "€57,00",
    items: 2,
    status: "shipped",
    payment: "paid",
    createdAt: "2026-05-17 15:30",
  },
];

export const adminCustomers: AdminCustomerRow[] = [
  {
    id: "CUST-001",
    name: "TechFirenze Srl",
    email: "orders@techfirenze.it",
    type: "b2b",
    status: "approved",
    orders: 38,
    revenue: "€8,420",
  },
  {
    id: "CUST-002",
    name: "MobileFix Roma",
    email: "admin@mobilefixroma.it",
    type: "b2b",
    status: "pending",
    orders: 12,
    revenue: "€2,180",
  },
  {
    id: "CUST-003",
    name: "Luca Bianchi",
    email: "luca@example.com",
    type: "retail",
    status: "approved",
    orders: 4,
    revenue: "€320",
  },
  {
    id: "CUST-004",
    name: "Repair Lab Milano",
    email: "buy@repairlab.it",
    type: "b2b",
    status: "suspended",
    orders: 21,
    revenue: "€4,960",
  },
];

export const adminInventory: AdminInventoryRow[] = [
  {
    id: "INV-001",
    sku: "IP11-SCR-SOFT-BLK",
    location: "A1-02",
    available: 120,
    reserved: 8,
    status: "in_stock",
    updatedAt: "2026-05-18 10:30",
  },
  {
    id: "INV-002",
    sku: "IP12-BAT-HQ",
    location: "B2-04",
    available: 60,
    reserved: 4,
    status: "in_stock",
    updatedAt: "2026-05-18 09:40",
  },
  {
    id: "INV-003",
    sku: "SA52-CHG-EU",
    location: "C1-11",
    available: 35,
    reserved: 6,
    status: "low_stock",
    updatedAt: "2026-05-17 16:45",
  },
  {
    id: "INV-004",
    sku: "XM12-LCD-OEM",
    location: "A3-08",
    available: 0,
    reserved: 0,
    status: "out_of_stock",
    updatedAt: "2026-05-16 12:05",
  },
];
