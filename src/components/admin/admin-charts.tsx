import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AdminChartPoint, AdminStatusPoint } from "@/lib/admin-data";
import { cn } from "@/lib/utils";

type SalesChartCardProps = Readonly<{
  title: string;
  points: AdminChartPoint[];
}>;

type DistributionCardProps = Readonly<{
  title: string;
  points: AdminStatusPoint[];
  labels: Record<string, string>;
}>;

export function SalesChartCard({ title, points }: SalesChartCardProps) {
  const maxValue = Math.max(...points.map((point) => point.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-52 items-end gap-2 border-b border-divider pb-3">
          {points.map((point) => (
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={point.label}>
              <div
                className="w-full rounded-t-md bg-[linear-gradient(180deg,#6366F1_0%,#C7D2FE_100%)] transition-all hover:opacity-85"
                style={{
                  height: `${Math.max(18, (point.value / maxValue) * 180)}px`,
                }}
              />
              <span className="max-w-full truncate font-mono text-[10px] text-muted-foreground">
                {point.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DistributionCard({
  labels,
  points,
  title,
}: DistributionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {points.map((point) => (
          <div className="grid gap-1.5" key={point.id}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium">{labels[point.id] ?? point.id}</span>
              <span className="font-mono text-muted-foreground">{point.value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
              <div
                className={cn("h-full rounded-full", point.color)}
                style={{ width: `${point.value}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
