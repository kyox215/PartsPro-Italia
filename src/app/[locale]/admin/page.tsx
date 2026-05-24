import { notFound } from "next/navigation";

import {
  DistributionCard,
  SalesChartCard,
} from "@/components/admin/admin-charts";
import { AdminOrdersTable } from "@/components/admin/admin-data-tables";
import { DashboardMetricCard } from "@/components/admin/dashboard-metric-card";
import {
  adminMetrics,
  adminOrders,
  inventoryDistribution,
  orderStatusDistribution,
  salesTrend,
} from "@/lib/admin-data";
import { getMessages, isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type AdminPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale);
  const copy = messages.admin;

  return (
    <main className="grid min-w-0 gap-4 p-3 sm:p-4">
      <section className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-normal">
          {copy.dashboard.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.dashboard.description}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {adminMetrics.map((metric) => (
          <DashboardMetricCard
            key={metric.id}
            label={copy.dashboard.metrics[metric.id] ?? metric.id}
            metric={metric}
          />
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <SalesChartCard points={salesTrend} title={copy.dashboard.salesTrend} />
        <DistributionCard
          labels={copy.status}
          points={orderStatusDistribution}
          title={copy.dashboard.orderStatus}
        />
        <DistributionCard
          labels={copy.status}
          points={inventoryDistribution}
          title={copy.dashboard.inventoryStatus}
        />
      </section>

      <section className="grid gap-3">
        <div>
          <h2 className="text-lg font-semibold">{copy.dashboard.recentOrders}</h2>
        </div>
        <AdminOrdersTable copy={copy} data={adminOrders} />
      </section>
    </main>
  );
}
