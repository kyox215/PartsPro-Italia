import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CatalogSearchFormProps = Readonly<{
  action: string;
  className?: string;
  defaultValue?: string;
  labels: {
    placeholder: string;
    submit: string;
  };
}>;

export function CatalogSearchForm({
  action,
  className,
  defaultValue,
  labels,
}: CatalogSearchFormProps) {
  return (
    <form
      action={action}
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-lg border border-primary-border bg-surface p-1.5 shadow-[var(--shadow-xs)]",
        className,
      )}
    >
      <Search className="ml-2 size-4 shrink-0 text-muted-foreground" />
      <Input
        className="h-9 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
        defaultValue={defaultValue}
        name="q"
        placeholder={labels.placeholder}
      />
      <Button className="h-9 shrink-0 px-3" type="submit">
        {labels.submit}
      </Button>
    </form>
  );
}
