import { Badge } from "@/components/ui/badge";
import type { QualityGrade } from "@/types";

export function QualityBadge({ quality }: Readonly<{ quality: QualityGrade }>) {
  return <Badge variant="quality">{quality}</Badge>;
}
