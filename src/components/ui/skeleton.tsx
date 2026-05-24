import * as React from "react";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted before:absolute before:inset-0 before:-translate-x-full before:animate-[skeleton-shimmer_1.4s_var(--ease-out)_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.72),transparent)]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
