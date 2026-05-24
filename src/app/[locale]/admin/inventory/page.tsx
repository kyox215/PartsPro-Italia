import { notFound } from "next/navigation";

import { AdminInventoryTable } from "@/components/admin/admin-data-tables";
import { adminInventory } from "@/lib/admin-data";
import { getMessages, isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type AdminInventoryPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function AdminInventoryPage({
  params,
}: AdminInventoryPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const copy = getMessages(locale).admin;

  return (
    <main className="grid min-w-0 gap-4 p-3 sm:p-4">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal">
          {copy.pages.inventory.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.pages.inventory.description}
        </p>
      </section>
      <AdminInventoryTable copy={copy} data={adminInventory} />
    </main>
  );
}
