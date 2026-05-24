import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = Readonly<{
  status: string;
  labels: Record<string, string>;
}>;

const warningStatuses = new Set(["draft", "low_stock", "pending", "new"]);
const successStatuses = new Set(["active", "paid", "approved", "in_stock", "shipped"]);
const infoStatuses = new Set(["processing", "b2b", "retail"]);
const dangerStatuses = new Set(["suspended", "out_of_stock"]);

export function StatusBadge({ status, labels }: StatusBadgeProps) {
  const variant = dangerStatuses.has(status)
    ? "destructive"
    : warningStatuses.has(status)
      ? "warning"
      : successStatuses.has(status)
        ? "success"
        : infoStatuses.has(status)
          ? "info"
          : "outline";

  return <Badge variant={variant}>{labels[status] ?? status}</Badge>;
}
