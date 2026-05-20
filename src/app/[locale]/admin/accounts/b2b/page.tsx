import { redirect } from "next/navigation";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AdminAccountsB2BRedirectPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  redirect(localizePath(locale, "/admin/accounts/customers?filter=wholesale_pending"));
}
