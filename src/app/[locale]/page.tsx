import { notFound } from "next/navigation";

import { HomePage } from "@/components/home/home-page";
import { getMessages, isLocale } from "@/lib/i18n";

type LocalePageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale);

  return <HomePage copy={messages.home} locale={locale} />;
}
