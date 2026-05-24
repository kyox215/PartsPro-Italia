import { notFound } from "next/navigation";

import { AdminProductsTable } from "@/components/admin/admin-data-tables";
import { adminProducts } from "@/lib/admin-data";
import { getMessages, isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type AdminProductsPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function AdminProductsPage({
  params,
}: AdminProductsPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const copy = getMessages(locale).admin;

  return (
    <main className="grid min-w-0 gap-4 p-3 sm:p-4">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal">
          {copy.pages.products.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.pages.products.description}
        </p>
      </section>
      <AdminProductsTable copy={copy} data={adminProducts} />
    </main>
  );
}
