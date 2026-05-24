import { Skeleton } from "@/components/ui/skeleton";

export function CatalogLoading() {
  return (
    <main className="min-w-0 flex-1 bg-background pb-20 text-foreground md:pb-8">
      <section className="mx-auto grid w-full max-w-7xl gap-4 px-3 py-4 sm:px-5">
        <Skeleton className="h-36 rounded-lg" />
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="hidden gap-3 rounded-lg border border-border bg-surface p-3 lg:grid">
            <Skeleton className="h-5 w-20" />
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton className="h-8" key={index} />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton className="h-44 rounded-lg" key={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function ProductDetailLoading() {
  return (
    <main className="min-w-0 flex-1 bg-background pb-20 text-foreground md:pb-8">
      <section className="mx-auto grid w-full max-w-7xl gap-4 px-3 py-4 sm:px-5">
        <Skeleton className="h-8 w-36" />
        <div className="grid gap-4 rounded-lg border border-primary-border bg-surface p-3 sm:p-4 lg:grid-cols-[360px_1fr]">
          <Skeleton className="min-h-64 rounded-lg" />
          <div className="grid content-start gap-4">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-10 w-full max-w-xl" />
            <div className="grid gap-2 sm:grid-cols-3">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          </div>
        </div>
        <Skeleton className="h-56 rounded-lg" />
      </section>
    </main>
  );
}
