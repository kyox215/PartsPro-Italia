import Link from "next/link";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  Info,
  Search,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "default" | "blue" | "green" | "amber" | "red" | "violet" | "slate";

const toneClasses: Record<Tone, string> = {
  default: "bg-stone-100 text-stone-700 ring-stone-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  red: "bg-rose-50 text-rose-700 ring-rose-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function AdminPageHeader({
  title,
  description,
  eyebrow,
  actions,
}: Readonly<{
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
}>) {
  return (
    <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-stone-500">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="max-w-4xl text-xl font-black leading-tight text-stone-950 sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-stone-600 sm:text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminPanel({
  title,
  description,
  toolbar,
  children,
  className,
  contentClassName,
}: Readonly<{
  title?: ReactNode;
  description?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}>) {
  return (
    <section
      className={cn(
        "content-visibility-auto rounded-lg border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      {(title || description || toolbar) ? (
        <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? (
              <h3 className="text-sm font-black leading-5 text-stone-950">{title}</h3>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-xs font-semibold leading-5 text-stone-500">
                {description}
              </p>
            ) : null}
          </div>
          {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-3", contentClassName)}>{children}</div>
    </section>
  );
}

export function AdminMetricCard({
  icon: Icon,
  label,
  value,
  trend,
  tone = "default",
  caption,
}: Readonly<{
  icon?: LucideIcon;
  label: ReactNode;
  value: ReactNode;
  trend?: ReactNode;
  tone?: Tone;
  caption?: ReactNode;
}>) {
  return (
    <div className="rounded-lg border border-black/5 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black uppercase tracking-wide text-stone-400">
            {label}
          </p>
          <p className="mt-2 break-words text-xl font-black leading-none text-stone-950">
            {value}
          </p>
        </div>
        {Icon ? (
          <span className={cn("rounded-md p-1.5 ring-1", toneClasses[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      {(trend || caption) ? (
        <div className="mt-2 flex min-h-5 flex-wrap items-center gap-1.5">
          {trend}
          {caption ? (
            <span className="text-[11px] font-semibold leading-4 text-stone-500">{caption}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function AdminTrendBadge({
  children,
  direction = "up",
  tone = direction === "down" ? "red" : "green",
}: Readonly<{
  children: ReactNode;
  direction?: "up" | "down" | "flat";
  tone?: Tone;
}>) {
  const Icon = direction === "flat" ? CircleDashed : direction === "down" ? ArrowDownRight : ArrowUpRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-black ring-1",
        toneClasses[tone],
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

export function AdminTabs({
  items,
  className,
  wrap = false,
}: Readonly<{
  items: Array<{ href: string; label: ReactNode; active?: boolean; count?: number | string }>;
  className?: string;
  wrap?: boolean;
}>) {
  return (
    <div
      className={cn(
        "flex gap-1 rounded-lg bg-white p-1 shadow-sm",
        wrap ? "flex-wrap" : "overflow-x-auto",
        className,
      )}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-black transition",
            item.active
              ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-200"
              : "text-slate-500 hover:bg-white hover:text-blue-700",
          )}
        >
          {item.label}
          {item.count !== undefined ? (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px]",
                item.active ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500",
              )}
            >
              {item.count}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

export function AdminRecordList({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return <div className={cn("grid min-w-0 gap-2", className)}>{children}</div>;
}

export function AdminDataTable({
  children,
  emptyState,
  minWidth = 900,
  mobileCards,
  mobileBreakpoint = "md",
}: Readonly<{
  children?: ReactNode;
  emptyState?: ReactNode;
  minWidth?: number;
  mobileCards?: ReactNode;
  mobileBreakpoint?: "sm" | "md" | "lg";
}>) {
  if (!children) {
    return emptyState ? <>{emptyState}</> : null;
  }

  const desktopVisibility = {
    sm: "hidden sm:block",
    md: "hidden md:block",
    lg: "hidden lg:block",
  }[mobileBreakpoint];
  const mobileVisibility = {
    sm: "sm:hidden",
    md: "md:hidden",
    lg: "lg:hidden",
  }[mobileBreakpoint];

  return (
    <>
      {mobileCards ? <div className={mobileVisibility}>{mobileCards}</div> : null}
      <div
        className={cn(
          "max-w-full overflow-x-auto",
          mobileCards ? desktopVisibility : "block",
        )}
      >
        <div style={{ minWidth }}>{children}</div>
      </div>
    </>
  );
}

export function AdminEmptyState({
  icon: Icon = Search,
  title,
  description,
  action,
}: Readonly<{
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}>) {
  return (
    <div className="rounded-lg border border-dashed border-black/10 bg-stone-50 px-3 py-6 text-center">
      <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-white text-stone-500 shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="mt-3 text-sm font-black text-stone-950">{title}</h3>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-xs font-semibold leading-5 text-stone-500">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function AdminNotice({
  title,
  children,
  tone = "info",
}: Readonly<{
  title?: ReactNode;
  children: ReactNode;
  tone?: "info" | "success" | "warning" | "danger";
}>) {
  const toneMap = {
    info: "border-sky-100 bg-sky-50 text-sky-900",
    success: "border-emerald-100 bg-emerald-50 text-emerald-900",
    warning: "border-amber-100 bg-amber-50 text-amber-900",
    danger: "border-rose-100 bg-rose-50 text-rose-900",
  };
  const Icon =
    tone === "success" ? CheckCircle2 : tone === "warning" || tone === "danger" ? CircleAlert : Info;

  return (
    <div className={cn("rounded-lg border px-3 py-2", toneMap[tone])}>
      <div className="flex gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          {title ? <p className="text-xs font-black">{title}</p> : null}
          <div className="text-xs font-semibold leading-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AdminModalShell({
  title,
  description,
  children,
  footer,
}: Readonly<{
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}>) {
  return (
    <div className="rounded-lg border border-black/10 bg-white shadow-xl">
      <div className="border-b border-black/5 px-5 py-4">
        <h3 className="text-lg font-black text-stone-950">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm font-medium leading-6 text-stone-500">{description}</p>
        ) : null}
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer ? <div className="border-t border-black/5 px-5 py-4">{footer}</div> : null}
    </div>
  );
}

export function AdminInput({
  label,
  helper,
  className,
  inputClassName,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  helper?: ReactNode;
  inputClassName?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label ? <span className="text-xs font-black uppercase tracking-wide text-stone-500">{label}</span> : null}
      <input
        className={cn(
          "mt-1.5 h-9 w-full rounded-lg border border-black/10 bg-white px-2.5 text-sm font-semibold text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10",
          inputClassName,
        )}
        {...props}
      />
      {helper ? <span className="mt-1 block text-xs font-medium leading-5 text-stone-500">{helper}</span> : null}
    </label>
  );
}

export function AdminSelect({
  label,
  helper,
  className,
  selectClassName,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode;
  helper?: ReactNode;
  selectClassName?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label ? <span className="text-xs font-black uppercase tracking-wide text-stone-500">{label}</span> : null}
      <select
        className={cn(
          "mt-1.5 h-9 w-full rounded-lg border border-black/10 bg-white px-2.5 text-sm font-semibold text-stone-950 outline-none transition focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10",
          selectClassName,
        )}
        {...props}
      >
        {children}
      </select>
      {helper ? <span className="mt-1 block text-xs font-medium leading-5 text-stone-500">{helper}</span> : null}
    </label>
  );
}

export function AdminTextarea({
  label,
  helper,
  className,
  textareaClassName,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  helper?: ReactNode;
  textareaClassName?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label ? <span className="text-xs font-black uppercase tracking-wide text-stone-500">{label}</span> : null}
      <textarea
        className={cn(
          "mt-1.5 min-h-20 w-full rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm font-semibold text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10",
          textareaClassName,
        )}
        {...props}
      />
      {helper ? <span className="mt-1 block text-xs font-medium leading-5 text-stone-500">{helper}</span> : null}
    </label>
  );
}

export function AdminToggle({
  label,
  description,
  name,
  defaultChecked,
  value = "true",
}: Readonly<{
  label: ReactNode;
  description?: ReactNode;
  name: string;
  defaultChecked?: boolean;
  value?: string;
}>) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-black/5 bg-stone-50 p-3">
      <span className="min-w-0">
        <span className="block text-sm font-black text-stone-950">{label}</span>
        {description ? (
          <span className="mt-1 block text-xs font-medium leading-5 text-stone-500">
            {description}
          </span>
        ) : null}
      </span>
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="h-5 w-5 accent-stone-950"
      />
    </label>
  );
}

export function StatusPill({
  status,
  tone,
}: Readonly<{
  status: ReactNode;
  tone?: Tone;
}>) {
  const normalized = String(status).toLowerCase();
  const inferredTone =
    tone ??
    (normalized.includes("paid") ||
    normalized.includes("completed") ||
    normalized.includes("approved") ||
    normalized.includes("active")
      ? "green"
      : normalized.includes("pending") ||
          normalized.includes("processing") ||
          normalized.includes("open") ||
          normalized.includes("preorder")
        ? "amber"
        : normalized.includes("cancel") ||
            normalized.includes("reject") ||
            normalized.includes("failed") ||
            normalized.includes("refund")
          ? "red"
          : normalized.includes("ship") || normalized.includes("review")
            ? "blue"
            : "slate");

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md px-2 py-1 text-xs font-black ring-1",
        toneClasses[inferredTone],
      )}
    >
      <span className="truncate">{status}</span>
    </span>
  );
}

export function AdminButtonLink({
  href,
  children,
  variant = "primary",
}: Readonly<{
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}>) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-black transition",
        variant === "primary"
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700",
      )}
    >
      {children}
    </Link>
  );
}

export function AdminWorkspaceGrid({
  children,
  rail,
  className,
}: Readonly<{
  children: ReactNode;
  rail?: ReactNode;
  className?: string;
}>) {
  return (
    <div className={cn("min-w-0 space-y-3", className)}>
      {rail ? <div className="min-w-0">{rail}</div> : null}
      <div className="min-w-0 space-y-3">{children}</div>
    </div>
  );
}

export function AdminActionRail({
  title,
  description,
  children,
}: Readonly<{
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}>) {
  return (
    <section className="space-y-2 rounded-xl border border-black/5 bg-white/70 p-2 shadow-sm">
      {(title || description) ? (
        <div className="rounded-lg border border-black/5 bg-white px-3 py-2">
          {title ? <h3 className="text-sm font-black text-stone-950">{title}</h3> : null}
          {description ? (
            <p className="mt-0.5 text-xs font-semibold leading-5 text-stone-500">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="grid min-w-0 gap-2 md:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}

export function AdminCollapsiblePanel({
  title,
  summary,
  children,
  defaultOpen = false,
}: Readonly<{
  title: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}>) {
  return (
    <details
      className="group rounded-lg border border-black/5 bg-white shadow-sm"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-black text-stone-950 marker:hidden">
        <span className="min-w-0">
          <span className="block truncate">{title}</span>
          {summary ? (
            <span className="mt-0.5 block truncate text-xs font-semibold text-stone-500">
              {summary}
            </span>
          ) : null}
        </span>
        <span className="rounded-md bg-stone-100 px-2 py-1 text-[11px] font-black text-stone-500 group-open:hidden">
          Open
        </span>
        <span className="hidden rounded-md bg-stone-950 px-2 py-1 text-[11px] font-black text-white group-open:inline">
          Close
        </span>
      </summary>
      <div className="border-t border-black/5 p-3">{children}</div>
    </details>
  );
}

export function AdminMetricStrip({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return (
    <section
      className={cn(
        "grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6",
        className,
      )}
    >
      {children}
    </section>
  );
}
