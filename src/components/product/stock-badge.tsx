import { Badge } from "@/components/ui/badge";

type StockBadgeProps = Readonly<{
  stock: number;
  labels: {
    inStock: string;
    lowStock: string;
    outOfStock: string;
  };
}>;

export function StockBadge({ stock, labels }: StockBadgeProps) {
  if (stock <= 0) {
    return <Badge variant="destructive">{labels.outOfStock}</Badge>;
  }

  if (stock < 40) {
    return <Badge variant="warning">{labels.lowStock}</Badge>;
  }

  return <Badge variant="stock">{labels.inStock}</Badge>;
}
