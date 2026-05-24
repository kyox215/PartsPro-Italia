import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireBackoffice } from "@/lib/auth/session";
import { getMessages, isLocale } from "@/lib/i18n";
import type { AppRole } from "@/types";

export const dynamic = "force-dynamic";

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const { profile, user } = await requireBackoffice(locale, `/${locale}/admin`);
  const messages = getMessages(locale);

  return (
    <AdminShell
      copy={messages.admin}
      email={profile?.email ?? user?.email}
      locale={locale}
      role={(profile?.role as AppRole | null | undefined) ?? null}
    >
      {children}
    </AdminShell>
  );
}
