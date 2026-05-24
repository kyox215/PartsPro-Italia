import Link from "next/link";
import { ArrowRight, BadgeEuro, Clock, ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types";

type B2BCtaProps = Readonly<{
  locale: Locale;
  copy: {
    title: string;
    description: string;
    primary: string;
    secondary: string;
    benefits: string[];
  };
}>;

const icons = [BadgeEuro, Clock, ShieldCheck];

export function B2BCta({ locale, copy }: B2BCtaProps) {
  return (
    <section className="rounded-lg border border-primary-border bg-[linear-gradient(135deg,#EEF2FF_0%,#FFFFFF_52%,#ECFEFF_100%)] p-4 shadow-[var(--shadow-xs)] sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0 space-y-3">
          <h2 className="text-xl font-semibold tracking-normal text-foreground">
            {copy.title}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {copy.description}
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {copy.benefits.map((benefit, index) => {
              const Icon = icons[index] ?? ShieldCheck;
              return (
                <div
                  className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-surface/80 px-3 py-2 text-sm"
                  key={benefit}
                >
                  <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="truncate">{benefit}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            className={cn(buttonVariants(), "min-w-32")}
            href={`/${locale}/register`}
          >
            {copy.primary}
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={`/${locale}/login`}
          >
            {copy.secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
