import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-md border px-2 py-1 text-xs font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}
