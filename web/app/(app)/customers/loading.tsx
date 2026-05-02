import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { SkeletonTable } from "@/components/zims/Skeleton";

export default function CustomersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-8 w-48 max-w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 md:h-9" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-9 w-36 shrink-0 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
      <Card>
        <CardHeader className="space-y-2">
          <div className="h-5 w-44 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-52 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        </CardHeader>
        <CardContent>
          <SkeletonTable rows={6} />
        </CardContent>
      </Card>
    </div>
  );
}
