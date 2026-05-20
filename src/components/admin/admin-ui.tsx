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

type Tone = "default" | "blue" | "green" | "amber" | "red" | "violet" | "slate";

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
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-stone-500">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="max-w-4xl text-2xl font-black leading-tight text-stone-950 sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-stone-600">
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
    <section className={cn("rounded-lg border border-black/5 bg-white shadow-sm", className)}>
      {(title || description || toolbar) ? (
        <div className="flex flex-col gap-3 border-b border-black/5 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? (
              <h3 className="text-base font-black leading-6 text-stone-950">{title}</h3>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm font-medium leading-6 text-stone-500">
                {description}
              </p>
            ) : null}
          </div>
          {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-4", contentClassName)}>{children}</div>
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
    <div className="rounded-lg border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase tracking-wide text-stone-400">
            {label}
          </p>
          <p className="mt-3 break-words text-2xl font-black leading-none text-stone-950">
            {value}
          </p>
        </div>
        {Icon ? (
          <span className={cn("rounded-lg p-2 ring-1", toneClasses[tone])}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      {(trend || caption) ? (
        <div className="mt-4 flex min-h-6 flex-wrap items-center gap-2">
          {trend}
          {caption ? (
            <span className="text-xs font-semibold leading-5 text-stone-500">{caption}</span>
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
}: Readonly<{
  items: Array<{ href: string; label: ReactNode; active?: boolean; count?: number | string }>;
  className?: string;
}>) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto rounded-lg bg-white p-1 shadow-sm", className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-black transition",
            item.active
              ? "bg-stone-950 text-white"
              : "text-stone-500 hover:bg-stone-100 hover:text-stone-950",
          )}
        >
          {item.label}
          {item.count !== undefined ? (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px]",
                item.active ? "bg-white text-stone-950" : "bg-stone-100 text-stone-500",
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

export function AdminDataTable({
  children,
  emptyState,
  minWidth = 900,
}: Readonly<{
  children?: ReactNode;
  emptyState?: ReactNode;
  minWidth?: number;
}>) {
  if (!children) {
    return emptyState ? <>{emptyState}</> : null;
  }

  return (
    <div className="max-w-full overflow-x-auto">
      <div style={{ minWidth }}>{children}</div>
    </div>
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
    <div className="rounded-lg border border-dashed border-black/10 bg-stone-50 px-4 py-10 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-white text-stone-500 shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-base font-black text-stone-950">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-stone-500">
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
    <div className={cn("rounded-lg border px-4 py-3", toneMap[tone])}>
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0">
          {title ? <p className="text-sm font-black">{title}</p> : null}
          <div className="text-sm font-medium leading-6">{children}</div>
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
          "mt-2 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10",
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
          "mt-2 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-stone-950 outline-none transition focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10",
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
          "mt-2 min-h-28 w-full rounded-lg border border-black/10 bg-white px-3 py-3 text-sm font-semibold text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10",
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
        "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-black transition",
        variant === "primary"
          ? "bg-stone-950 text-white hover:bg-stone-800"
          : "border border-black/10 bg-white text-stone-800 hover:border-black/20 hover:text-stone-950",
      )}
    >
      {children}
    </Link>
  );
}
