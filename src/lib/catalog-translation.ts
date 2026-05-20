export type CatalogTranslationInput = {
  originalName: string;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  qualityGrade?: string | null;
  category?: string | null;
};

const colorTranslations: Record<string, string> = {
  black: "黑色",
  white: "白色",
  blue: "蓝色",
  red: "红色",
  green: "绿色",
  gold: "金色",
  silver: "银色",
  purple: "紫色",
  pink: "粉色",
  yellow: "黄色",
  grey: "灰色",
  gray: "灰色",
  orange: "橙色",
  teal: "青绿色",
  ultramarine: "群青色",
  starlight: "星光色",
  midnight: "午夜色",
  graphite: "石墨色",
  titanium: "钛色",
  "black titanium": "黑钛色",
  "white titanium": "白钛色",
  "blue titanium": "蓝钛色",
  "natural titanium": "原色钛",
};

const categoryTranslations: Record<string, string> = {
  "dock-connectors": "尾插 / 充电接口",
  "dock connector": "尾插 / 充电接口",
};

const colorKeys = Object.keys(colorTranslations).sort((a, b) => b.length - a.length);

export function translateCatalogProductName(input: CatalogTranslationInput) {
  const originalName = input.originalName.trim();
  const brand = normalizePart(input.brand);
  const model = normalizePart(input.model);
  const color = translateColor(input.color) ?? detectColor(originalName);
  const quality = translateQuality(input.qualityGrade, originalName);
  const category = translateCategory(input.category, originalName);

  const core = [brand, model].filter(Boolean).join(" ").trim();
  const fallbackCore = stripKnownTokens(originalName);
  const translatedPart = color ? `${color}${category}` : category;
  const nameParts = [quality, core || fallbackCore, translatedPart].filter(Boolean);

  return nameParts.join(" ").replace(/\s+/g, " ").trim();
}

export function getCatalogChineseDescription(category?: string | null) {
  if (normalizeKey(category) === "dock-connectors") {
    return "从上游订货单导入的尾插 / 充电接口配件。预购预计 7-14 天到货。";
  }

  return "从上游订货单导入的配件。预购预计 7-14 天到货。";
}

export function isCatalogChineseTranslationStale(nameIt: string, nameZh?: string | null) {
  const normalizedZh = normalizePart(nameZh);
  return !normalizedZh || normalizedZh === normalizePart(nameIt);
}

function translateQuality(qualityGrade?: string | null, originalName = "") {
  const source = `${qualityGrade ?? ""} ${originalName}`.toLowerCase();

  if (/original\s+pulled|original\s+pull/.test(source)) {
    return "原拆";
  }

  if (/premium|high\s+quality\s+compatible/.test(source)) {
    return "高品质兼容";
  }

  return normalizePart(qualityGrade) || "高品质兼容";
}

function translateCategory(category?: string | null, originalName = "") {
  const key = normalizeKey(category);
  const normalizedOriginal = originalName.toLowerCase();

  if (key && categoryTranslations[key]) {
    return categoryTranslations[key];
  }

  if (/dock\s+connector/.test(normalizedOriginal)) {
    return categoryTranslations["dock connector"];
  }

  return normalizePart(category) || "配件";
}

function translateColor(color?: string | null) {
  const key = normalizeKey(color);
  return key ? colorTranslations[key] : null;
}

function detectColor(value: string) {
  const normalized = value.toLowerCase();
  const key = colorKeys.find((candidate) =>
    new RegExp(`\\b${escapeRegex(candidate)}\\b`, "i").test(normalized),
  );

  return key ? colorTranslations[key] : null;
}

function stripKnownTokens(value: string) {
  return value
    .replace(/original\s+pulled/gi, "")
    .replace(/premium/gi, "")
    .replace(/dock\s+connector/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePart(value?: string | null) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeKey(value?: string | null) {
  return normalizePart(value).toLowerCase();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
