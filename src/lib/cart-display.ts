import type { Locale } from "@/lib/i18n";

const zhQualityLabels: Record<string, string> = {
  "high quality compatible": "高品质兼容",
  premium: "高品质兼容",
  "original pull": "原拆",
  "original pulled": "原拆",
  "service pack": "服务包",
  "refurbished original": "翻新原装",
};

const qualityPrefixes = [
  "High Quality Compatible",
  "Original Pulled",
  "Original Pull",
  "Refurbished Original",
  "Service Pack",
  "Premium",
  "高品质兼容",
  "原拆",
  "原装拆机",
  "翻新原装",
  "服务包",
];

export function getCartDisplayName({
  name,
  quality,
}: Readonly<{
  name: string;
  quality?: string | null;
}>) {
  const prefixes = [...qualityPrefixes, quality ?? ""]
    .filter(Boolean)
    .map(escapeRegExp);
  const pattern = new RegExp(`^(${prefixes.join("|")})\\s*`, "i");
  const displayName = name.replace(pattern, "").trim();

  return displayName || name;
}

export function getQualityLabel(quality: string | null | undefined, locale: Locale) {
  const normalized = quality?.trim();
  if (!normalized) return "";

  if (locale === "zh") {
    return zhQualityLabels[normalized.toLowerCase()] ?? normalized;
  }

  return normalized;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
