import { Skeleton } from "@/components/ui/skeleton";

export function AdminDashboardLoading() {
  return (
    <main className="grid min-w-0 gap-4 p-3 sm:p-4">
      <div className="grid gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-32 rounded-lg" key={index} />
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
      <Skeleton className="h-80 rounded-lg" />
    </main>
  );
}

export function AdminTableLoading() {
  return (
    <main className="grid min-w-0 gap-4 p-3 sm:p-4">
      <div className="grid gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </main>
  );
}
