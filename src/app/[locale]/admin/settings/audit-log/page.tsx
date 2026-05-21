import { redirect } from "next/navigation";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AdminSettingsAuditRedirect({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "zh";
  redirect(localizePath(locale, "/admin/accounts/audit-log"));
}
