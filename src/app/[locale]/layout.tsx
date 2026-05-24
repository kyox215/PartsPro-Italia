import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getMessages, isLocale, locales } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}>;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, "params">): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const messages = getMessages(locale);
  const languageAlternates = Object.fromEntries(
    locales.map((supportedLocale) => [
      supportedLocale,
      `/${supportedLocale}`,
    ]),
  );

  return {
    title: messages.app.name,
    description: messages.app.description,
    alternates: {
      canonical: `/${locale}`,
      languages: languageAlternates,
    },
    openGraph: {
      title: messages.app.name,
      description: messages.app.description,
      siteName: siteConfig.name,
      url: `/${locale}`,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <section className="flex min-h-full flex-1 flex-col" lang={locale}>
      {children}
    </section>
  );
}
