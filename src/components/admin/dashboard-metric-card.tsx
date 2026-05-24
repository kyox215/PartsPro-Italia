import { ArrowUpRight, Boxes, Euro, ShoppingBag, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AdminMetric } from "@/lib/admin-data";
import { cn } from "@/lib/utils";

type DashboardMetricCardProps = Readonly<{
  metric: AdminMetric;
  label: string;
}>;

const metricIcon = {
  customers: Users,
  orders: ShoppingBag,
  revenue: Euro,
  sku: Boxes,
};

const toneClassName: Record<AdminMetric["tone"], string> = {
  info: "bg-info/10 text-info",
  primary: "bg-primary-soft text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export function DashboardMetricCard({ metric, label }: DashboardMetricCardProps) {
  const Icon = metricIcon[metric.id as keyof typeof metricIcon] ?? Boxes;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
        <div className="grid min-w-0 gap-1">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {label}
          </CardTitle>
          <p className="text-2xl font-semibold leading-8">{metric.value}</p>
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            toneClassName[metric.tone],
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="inline-flex items-center gap-1 text-xs font-medium text-success">
          <ArrowUpRight className="size-3" aria-hidden="true" />
          {metric.change}
        </p>
      </CardContent>
    </Card>
  );
}
