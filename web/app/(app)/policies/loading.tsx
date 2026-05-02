import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  SkeletonPageHeader,
  SkeletonTable,
} from "@/components/zims/Skeleton";

export default function PoliciesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:justify-between">
        <SkeletonPageHeader className="min-w-0 flex-1" />
        <div className="flex w-full flex-wrap gap-2 md:w-auto">
          <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      <Card>
        <CardHeader className="space-y-2">
          <div className="h-5 w-36 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-48 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        </CardHeader>
        <CardContent className="space-y-4">
          <SkeletonTable rows={6} />
          <div className="flex justify-between gap-2">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="flex gap-2">
              <div className="h-8 w-16 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
              <div className="h-8 w-16 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
