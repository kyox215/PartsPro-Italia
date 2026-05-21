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
    <div className={cn("flex items-center gap-2.5", compact ? "pb-0" : "pb-5")}>
      <div className="grid h-10 w-10 shrink-0 grid-cols-2 gap-1 rounded-xl bg-blue-600 p-1.5 shadow-sm shadow-blue-200">
        <span className="rounded-sm bg-white" />
        <span className="rounded-sm bg-blue-100" />
        <span className="rounded-sm bg-blue-200" />
        <span className="rounded-sm bg-cyan-200" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-black uppercase tracking-wide text-slate-400">
          {title}
        </p>
        <h1 className="truncate text-base font-black text-slate-950">{subtitle}</h1>
      </div>
    </div>
  );
}
