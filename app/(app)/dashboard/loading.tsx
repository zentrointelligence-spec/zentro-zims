import {
  SkeletonKpi,
  SkeletonPageHeader,
  SkeletonTable,
} from "@/components/zims/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonKpi key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <SkeletonTable rows={4} />
          </div>
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <SkeletonTable rows={4} />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <SkeletonTable rows={6} />
        </div>
      </div>
    </div>
  );
}
