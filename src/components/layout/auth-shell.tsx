import { ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthShellProps = Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}>;

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="flex min-h-full flex-1 items-center bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex flex-col justify-between gap-8 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-xs)]">
          <div className="space-y-5">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(99,102,241,0.24)]">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                PartsPro
              </p>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                {title}
              </h1>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          {footer ? (
            <div className="text-sm text-muted-foreground">{footer}</div>
          ) : null}
        </section>

        <Card className="self-start">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
