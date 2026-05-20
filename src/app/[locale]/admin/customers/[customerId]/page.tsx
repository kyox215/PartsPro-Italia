import { redirect } from "next/navigation";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function LegacyAdminCustomerDetailPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string; customerId: string }>;
}>) {
  const { locale: rawLocale, customerId } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  redirect(localizePath(locale, `/admin/accounts/customers/${customerId}`));
}
