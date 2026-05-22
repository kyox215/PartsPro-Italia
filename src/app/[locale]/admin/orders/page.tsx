import { OrdersListClient } from "@/admin/ui/orders-list-client";
import { hasAdminPermissionCode } from "@/admin/config/permissions";
import { listAdminOrders } from "@/admin/services/orders";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale } from "@/lib/i18n";

export default async function AdminOrdersPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale: rawLocale } = await params;
  const query = (await searchParams) ?? {};
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const auth = await getAuthContext();
  const canReadOrders = !auth.configured || hasAdminPermissionCode(auth, "orders:read");
  const result = canReadOrders
    ? await listAdminOrders(query)
    : {
        counts: {
          all: 0,
          cancelled: 0,
          completed: 0,
          expiring: 0,
          paid: 0,
          pending_bank_transfer: 0,
          pending_card: 0,
          pending_cash: 0,
          pending_payment: 0,
          processing: 0,
          refunded: 0,
          shipped: 0,
        },
        filter: "all" as const,
        items: [],
        page: 1,
        pageSize: 20,
        total: 0,
      };

  return (
    <OrdersListClient
      canReadOrders={canReadOrders}
      configured={auth.configured}
      error={valueOf(query.error)}
      locale={locale}
      result={result}
      saved={valueOf(query.saved)}
    />
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
