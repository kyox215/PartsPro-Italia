import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  catalogBrands,
  catalogCategories,
} from "@/lib/catalog-data";
import { cn } from "@/lib/utils";
import type { Locale, QualityGrade } from "@/types";

type CatalogFilterPanelProps = Readonly<{
  locale: Locale;
  basePath: string;
  className?: string;
  selectedCategory?: string;
  selectedBrand?: string;
  selectedQuality?: string;
  labels: {
    filters: string;
    categories: string;
    brands: string;
    quality: string;
    all: string;
  };
}>;

const qualities: QualityGrade[] = ["A+", "A", "B", "C"];

export function CatalogFilterPanel({
  locale,
  basePath,
  className,
  selectedCategory,
  selectedBrand,
  selectedQuality,
  labels,
}: CatalogFilterPanelProps) {
  return (
    <aside
      className={cn(
        "grid gap-3 rounded-lg border border-border bg-surface p-3 shadow-[var(--shadow-xs)]",
        className,
      )}
    >
      <h2 className="text-sm font-semibold">{labels.filters}</h2>
      <FilterGroup label={labels.categories}>
        <FilterLink active={!selectedCategory} href={basePath} label={labels.all} />
        {catalogCategories.map((category) => (
          <FilterLink
            active={selectedCategory === category.slug}
            href={`/${locale}/category/${category.slug}`}
            key={category.slug}
            label={category.name[locale]}
          />
        ))}
      </FilterGroup>
      <FilterGroup label={labels.brands}>
        <FilterLink active={!selectedBrand} href={basePath} label={labels.all} />
        {catalogBrands.map((brand) => (
          <FilterLink
            active={selectedBrand === brand.slug}
            href={`/${locale}/brand/${brand.slug}`}
            key={brand.slug}
            label={brand.name}
          />
        ))}
      </FilterGroup>
      <FilterGroup label={labels.quality}>
        <FilterLink
          active={!selectedQuality}
          href={withQuality(basePath)}
          label={labels.all}
        />
        <div className="flex flex-wrap gap-1.5">
          {qualities.map((quality) => (
            <Link href={withQuality(basePath, quality)} key={quality}>
              <Badge variant={selectedQuality === quality ? "quality" : "outline"}>
                {quality}
              </Badge>
            </Link>
          ))}
        </div>
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({
  children,
  label,
}: Readonly<{
  children: React.ReactNode;
  label: string;
}>) {
  return (
    <section className="grid gap-2">
      <h3 className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </h3>
      <div className="grid gap-1">{children}</div>
    </section>
  );
}

function FilterLink({
  active,
  href,
  label,
}: Readonly<{
  active: boolean;
  href: string;
  label: string;
}>) {
  return (
    <Link
      className={cn(
        "flex min-w-0 items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-primary-soft hover:text-secondary-foreground",
        active && "bg-primary-soft font-medium text-secondary-foreground",
      )}
      href={href}
    >
      <span className="truncate">{label}</span>
    </Link>
  );
}

function withQuality(path: string, quality?: QualityGrade) {
  const [pathname = path, search = ""] = path.split("?");
  const params = new URLSearchParams(search);

  if (quality) {
    params.set("quality", quality);
  } else {
    params.delete("quality");
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
