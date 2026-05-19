import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700",
  secondary:
    "border-slate-300 bg-white text-slate-900 hover:border-blue-300 hover:text-blue-700",
  dark: "border-slate-900 bg-slate-950 text-white hover:bg-slate-800",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: Readonly<{
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}>) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition",
        variants[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
