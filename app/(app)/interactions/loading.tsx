import { SkeletonPageHeader, SkeletonRow } from "@/components/zims/Skeleton";

export default function InteractionsLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <SkeletonPageHeader />
      <div className="flex min-h-[480px] flex-1 flex-col overflow-hidden rounded-lg border border-border md:flex-row">
        <div className="flex w-full shrink-0 flex-col border-b border-border md:w-[320px] md:border-b-0 md:border-r">
          <div className="shrink-0 border-b border-border p-3">
            <div className="h-8 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="flex-1 space-y-0 divide-y divide-border p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="size-9 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                <SkeletonRow className="flex-1 py-0" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden min-h-0 flex-1 flex-col gap-3 p-4 md:flex">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="min-h-[200px] flex-1 animate-pulse rounded-lg bg-gray-200/80 dark:bg-gray-800/80" />
        </div>
      </div>
    </div>
  );
}
