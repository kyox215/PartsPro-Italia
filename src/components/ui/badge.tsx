import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap transition-colors [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-soft text-secondary-foreground",
        secondary: "border-border bg-surface-muted text-foreground",
        outline: "border-border bg-surface text-foreground",
        success: "border-success/20 bg-success/10 text-success",
        warning: "border-warning/25 bg-warning/10 text-warning",
        destructive: "border-destructive/20 bg-destructive/10 text-destructive",
        info: "border-info/20 bg-info/10 text-info",
        quality: "border-success/20 bg-success/10 text-success",
        stock: "border-primary-border bg-primary-soft text-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
