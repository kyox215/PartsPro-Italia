import { notFound } from "next/navigation";

import { AdminCustomersTable } from "@/components/admin/admin-data-tables";
import { adminCustomers } from "@/lib/admin-data";
import { getMessages, isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type AdminCustomersPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function AdminCustomersPage({
  params,
}: AdminCustomersPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const copy = getMessages(locale).admin;

  return (
    <main className="grid min-w-0 gap-4 p-3 sm:p-4">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal">
          {copy.pages.customers.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.pages.customers.description}
        </p>
      </section>
      <AdminCustomersTable copy={copy} data={adminCustomers} />
    </main>
  );
}
