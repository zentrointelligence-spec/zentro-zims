import { cn } from "@/lib/utils";

const pulse =
  "animate-pulse rounded-lg bg-[#f1f5f9] dark:bg-slate-800";

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 py-2.5", className)}>
      <div className={cn("h-4 flex-1", pulse)} />
      <div className={cn("h-4 w-20 shrink-0", pulse)} />
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "divide-y divide-border rounded-md border border-border",
        className,
      )}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-slate-200 bg-white p-5 shadow-card",
        className,
      )}
    >
      <div className={cn("mb-4 h-4 w-1/3", pulse)} />
      <div className={cn("h-24 w-full", pulse)} />
    </div>
  );
}

export function SkeletonKpi({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[14px] bg-[#f1f5f9] p-4 shadow-none",
        className,
      )}
    >
      <div className={cn("h-3 w-24", pulse)} />
      <div className={cn("mt-3 h-8 w-16", pulse)} />
    </div>
  );
}

/** Title + subtitle bars matching PageHeader rhythm */
export function SkeletonPageHeader({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn("h-8 w-48 max-w-full md:h-9", pulse)} />
      <div className={cn("h-4 w-full max-w-xl", pulse)} />
    </div>
  );
}
