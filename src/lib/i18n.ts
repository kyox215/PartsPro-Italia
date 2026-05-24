import en from "@/messages/en.json";
import it from "@/messages/it.json";
import zh from "@/messages/zh.json";
import type { Dictionary, Locale } from "@/types";

export const locales = ["it", "en", "zh"] as const;
export const defaultLocale: Locale = "it";

const dictionaries = {
  en,
  it,
  zh,
} satisfies Record<Locale, Dictionary>;

export function isLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getMessages(locale: Locale): Dictionary {
  return dictionaries[locale];
}
