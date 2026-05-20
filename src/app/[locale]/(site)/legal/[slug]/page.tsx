import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";

const legalPages = ["privacy", "cookies", "terms", "returns", "battery", "quality"] as const;

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    legalPages.map((slug) => ({ locale, slug })),
  );
}

export default async function LegalPage({
  params,
}: Readonly<{ params: Promise<{ locale: string; slug: string }> }>) {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const dictionary = getDictionary(locale);

  if (!legalPages.includes(slug as (typeof legalPages)[number])) {
    notFound();
  }

  const title = dictionary.legal[slug as keyof typeof dictionary.legal] as string;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <article className="rounded-lg border border-slate-200 bg-white p-5 sm:p-8">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">
          {dictionary.legal.title}
        </Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">{title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
          <p>
            {locale === "it"
              ? "Template operativo per MVP. Prima della pubblicazione usare testi verificati da consulente legale/fiscale in Italia."
              : "这是 MVP 运营模板。正式上线前请让意大利法律/税务顾问确认最终文本。"}
          </p>
          <p>
            {locale === "it"
              ? "La pagina dovra coprire dati aziendali, IVA, fatturazione, protezione dati, garanzie, resi e limitazioni per batterie al litio quando rilevante."
              : "页面需覆盖公司信息、VAT、发票、数据保护、质保、退货以及锂电池限制等内容。"}
          </p>
        </div>
      </article>
    </div>
  );
}
