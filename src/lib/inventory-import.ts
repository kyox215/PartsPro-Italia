import { read, utils } from "xlsx";

export type SupplierCartImportRow = {
  rowNumber: number;
  ean13: string;
  originalName: string;
  quantity: number;
  costPrice: number;
  b2bPrice: number;
  retailPrice: number;
  sku: string;
  slug: string;
  brand: string;
  model: string;
  color: string | null;
  qualityGrade: "Original Pull" | "High Quality Compatible";
  category: "dock-connectors";
  compatibility: string[];
};

export type SupplierCartImportPayloadRow = {
  row_number: number;
  ean13: string;
  original_name: string;
  quantity: number;
  cost_price: number;
  b2b_price: number;
  retail_price: number;
  sku: string;
  slug: string;
  brand: string;
  model: string;
  color: string | null;
  quality_grade: string;
  category: string;
  compatibility: string[];
};

type RawCartRow = Record<string, unknown>;

const brandCodes: Record<string, string> = {
  Apple: "APL",
  Samsung: "SAM",
  Honor: "HON",
  Huawei: "HUA",
  Xiaomi: "XIA",
  OPPO: "OPP",
  Realme: "RLM",
  Motorola: "MOT",
  Nokia: "NOK",
  Sony: "SNY",
  LG: "LG",
  OnePlus: "OPL",
  Google: "GGL",
  Vivo: "VIV",
};

const knownBrands = Object.keys(brandCodes);
const knownColors = [
  "Black",
  "White",
  "Blue",
  "Red",
  "Green",
  "Gold",
  "Silver",
  "Purple",
  "Pink",
  "Yellow",
  "Grey",
  "Gray",
  "Orange",
];

export function parseSupplierCartWorkbook(input: Buffer | ArrayBuffer) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const workbook = read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Excel file has no sheets.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = utils.sheet_to_json<RawCartRow>(sheet, {
    defval: null,
    raw: true,
  });

  return parseSupplierCartRows(rows);
}

export function parseSupplierCartRows(rows: RawCartRow[]) {
  return rows
    .map((row, index) => parseSupplierCartRow(row, index + 2))
    .filter((row): row is SupplierCartImportRow => row !== null);
}

export function toSupplierCartPayload(rows: SupplierCartImportRow[]) {
  return rows.map<SupplierCartImportPayloadRow>((row) => ({
    row_number: row.rowNumber,
    ean13: row.ean13,
    original_name: row.originalName,
    quantity: row.quantity,
    cost_price: row.costPrice,
    b2b_price: row.b2bPrice,
    retail_price: row.retailPrice,
    sku: row.sku,
    slug: row.slug,
    brand: row.brand,
    model: row.model,
    color: row.color,
    quality_grade: row.qualityGrade,
    category: row.category,
    compatibility: row.compatibility,
  }));
}

function parseSupplierCartRow(row: RawCartRow, rowNumber: number) {
  const originalName = String(row.Nom ?? "").trim();
  const ean13 = formatEan(row["EAN-13"]);
  const quantity = Math.trunc(Number(row.Quantite ?? 0));
  const costPrice = roundMoney(Number(row["Prix HT"] ?? 0));

  if (!originalName || !ean13 || quantity <= 0 || !Number.isFinite(costPrice)) {
    return null;
  }

  const parsedName = parseProductName(originalName);
  const suffix = ean13.slice(-4);
  const sku = [
    "DCK",
    brandCodes[parsedName.brand] ?? cleanCode(parsedName.brand).slice(0, 3),
    compactModelCode(parsedName.model),
    parsedName.color ? cleanCode(parsedName.color).slice(0, 3) : "",
    suffix,
  ]
    .filter(Boolean)
    .join("-");

  return {
    rowNumber,
    ean13,
    originalName,
    quantity,
    costPrice,
    b2bPrice: roundUpToTenth(costPrice * 1.5),
    retailPrice: roundUpToTenth(costPrice * 2),
    sku,
    slug: `${slugify(originalName)}-${suffix}`,
    brand: parsedName.brand,
    model: parsedName.model,
    color: parsedName.color,
    qualityGrade: parsedName.qualityGrade,
    category: "dock-connectors" as const,
    compatibility: [parsedName.model],
  };
}

function parseProductName(originalName: string) {
  const qualityGrade = /original\s+pulled/i.test(originalName)
    ? "Original Pull"
    : "High Quality Compatible";
  const normalized = originalName
    .replace(/original\s+pulled/gi, "")
    .replace(/premium/gi, "")
    .replace(/dock\s+connector/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const brand =
    knownBrands.find((candidate) =>
      new RegExp(`\\b${escapeRegex(candidate)}\\b`, "i").test(normalized),
    ) ?? "Unknown";
  const brandMatch = normalized.match(new RegExp(`\\b${escapeRegex(brand)}\\b`, "i"));
  const afterBrand = brandMatch
    ? normalized.slice((brandMatch.index ?? 0) + brandMatch[0].length).trim()
    : normalized;
  const color = detectColor(afterBrand);
  const model = color
    ? afterBrand.replace(new RegExp(`\\b${escapeRegex(color)}\\b`, "i"), "").trim()
    : afterBrand.trim();

  return {
    brand: normalizeBrandName(brand),
    model: model || "Universal",
    color,
    qualityGrade,
  };
}

function formatEan(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value).toFixed(0);
  }

  return String(value ?? "").replace(/\D/g, "");
}

function detectColor(value: string) {
  return (
    knownColors.find((color) =>
      new RegExp(`\\b${escapeRegex(color)}\\b`, "i").test(value),
    ) ?? null
  );
}

function normalizeBrandName(value: string) {
  if (/^oppo$/i.test(value)) return "OPPO";
  return knownBrands.find((brand) => brand.toLowerCase() === value.toLowerCase()) ?? value;
}

function compactModelCode(value: string) {
  return cleanCode(value)
    .replace(/^IPHONE/, "IP")
    .replace(/^GALAXY/, "GAL")
    .replace(/^MOTO/, "M")
    .slice(0, 14);
}

function cleanCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "");
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "imported-item"
  );
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundUpToTenth(value: number) {
  return Math.ceil(value * 10) / 10;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
