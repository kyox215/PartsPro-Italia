import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { hasAdminPermissionCode } from "@/admin/config/permissions";
import { getAdminOrderDetailView } from "@/admin/services/orders";
import { OrderDetailClient } from "@/admin/ui/order-detail-client";
import { adminCsrfCookieName, adminCsrfFieldName } from "@/lib/admin-csrf";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { orderRouteId } from "@/lib/order-number";

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string; orderId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale: rawLocale, orderId: rawOrderId } = await params;
  const query = (await searchParams) ?? {};
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const auth = await getAuthContext();
  const canReadOrders = !auth.configured || hasAdminPermissionCode(auth, "orders:read");

  if (!canReadOrders) {
    redirect(localizePath(locale, "/admin/orders?error=permission-denied"));
  }

  const order = await getAdminOrderDetailView(decodeURIComponent(rawOrderId));

  if (!order) {
    notFound();
  }

  const cookieStore = await cookies();
  const csrfToken = cookieStore.get(adminCsrfCookieName)?.value ?? "";
  const returnTo = localizePath(locale, `/admin/orders/${orderRouteId(order)}`);

  return (
    <OrderDetailClient
      canWriteFinance={!auth.configured || hasAdminPermissionCode(auth, "finance:write")}
      canWriteOrders={!auth.configured || hasAdminPermissionCode(auth, "orders:write")}
      csrfFieldName={adminCsrfFieldName}
      csrfToken={csrfToken}
      error={valueOf(query.error)}
      locale={locale}
      order={order}
      returnTo={returnTo}
      saved={valueOf(query.saved)}
    />
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
