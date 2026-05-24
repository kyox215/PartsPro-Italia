import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  isInvalid?: boolean;
};

function Input({ className, type, isInvalid, ...props }: InputProps) {
  return (
    <input
      data-slot="input"
      type={type}
      aria-invalid={isInvalid || props["aria-invalid"]}
      className={cn(
        "flex h-9 w-full min-w-0 rounded-lg border border-input bg-surface px-3 py-1 text-sm shadow-[var(--shadow-xs)] transition-[border-color,box-shadow,background-color] duration-200 outline-none placeholder:text-muted-foreground/75",
        "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/15",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/15",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
