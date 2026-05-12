import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  badge,
  breadcrumb,
  className,
  actions,
}: {
  title: string;
  description?: string;
  badge?: string | number;
  breadcrumb?: string;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {breadcrumb ? (
          <p className="mb-1 text-xs text-slate-400">{breadcrumb}</p>
        ) : null}
        <div className="flex items-center gap-2">
          <h1 className="text-[22px] font-bold tracking-[-0.01em] text-slate-900">
            {title}
          </h1>
          {badge !== undefined ? (
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              {badge}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="mt-1 max-w-2xl text-[13px] text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div
          className={cn(
            "flex w-full items-center gap-3 md:w-auto md:shrink-0 md:flex-row md:flex-wrap md:justify-end",
            "[&_a]:w-full md:[&_a]:w-auto [&_button]:w-full md:[&_button]:w-auto",
          )}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}
