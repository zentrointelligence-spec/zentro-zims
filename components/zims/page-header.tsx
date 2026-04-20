import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  className,
  actions,
}: {
  title: string;
  description?: string;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div
          className={cn(
            "flex w-full flex-col gap-2 md:w-auto md:shrink-0 md:flex-row md:flex-wrap md:justify-end",
            "[&_a]:w-full md:[&_a]:w-auto [&_button]:w-full md:[&_button]:w-auto",
          )}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}
