import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  SkeletonPageHeader,
  SkeletonTable,
} from "@/components/zims/Skeleton";

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SkeletonPageHeader className="min-w-0 flex-1" />
        <div className="h-9 w-28 shrink-0 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="h-9 w-full max-w-2xl animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      <Card>
        <CardHeader className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-56 max-w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        </CardHeader>
        <CardContent>
          <SkeletonTable rows={6} />
        </CardContent>
      </Card>
    </div>
  );
}
