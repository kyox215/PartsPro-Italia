import { notFound } from "next/navigation";

import { AdminOrdersTable } from "@/components/admin/admin-data-tables";
import { adminOrders } from "@/lib/admin-data";
import { getMessages, isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type AdminOrdersPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function AdminOrdersPage({ params }: AdminOrdersPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const copy = getMessages(locale).admin;

  return (
    <main className="grid min-w-0 gap-4 p-3 sm:p-4">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal">
          {copy.pages.orders.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.pages.orders.description}
        </p>
      </section>
      <AdminOrdersTable copy={copy} data={adminOrders} />
    </main>
  );
}
