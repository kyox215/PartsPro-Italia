import { cn } from "@/lib/utils";

export function AdminBrand({
  title,
  subtitle,
  compact = false,
}: Readonly<{
  title: string;
  subtitle: string;
  compact?: boolean;
}>) {
  return (
    <div className={cn("flex items-center gap-2", compact ? "pb-0" : "pb-3")}>
      <div className="grid h-9 w-9 shrink-0 grid-cols-2 gap-1 rounded-lg bg-stone-950 p-1.5">
        <span className="rounded-sm bg-white" />
        <span className="rounded-sm bg-emerald-400" />
        <span className="rounded-sm bg-sky-400" />
        <span className="rounded-sm bg-amber-300" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-black uppercase tracking-wide text-stone-500">
          {title}
        </p>
        <h1 className="truncate text-base font-black text-stone-950">{subtitle}</h1>
      </div>
    </div>
  );
}
