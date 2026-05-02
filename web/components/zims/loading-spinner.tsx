import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/** Inline 16px spinner for buttons and compact UI. */
export function InlineSpinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("size-4 shrink-0 animate-spin", className)}
      aria-hidden
    />
  );
}

export function LoadingSpinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[12rem] items-center justify-center text-muted-foreground",
        className,
      )}
    >
      <Loader2
        className="h-8 w-8 animate-spin"
        aria-hidden
        aria-label={label}
      />
    </div>
  );
}
