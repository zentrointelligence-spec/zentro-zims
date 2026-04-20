import type { ComponentType, ReactNode, SVGProps } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /** Primary CTA (e.g. link styled as a button) */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <Icon className="h-12 w-12 text-slate-500" aria-hidden />
        </div>
      ) : null}
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-6 flex justify-center [&_a]:bg-linear-to-r [&_a]:from-brand-500 [&_a]:to-brand-600 [&_a]:text-white [&_button]:bg-linear-to-r [&_button]:from-brand-500 [&_button]:to-brand-600 [&_button]:text-white">
          {action}
        </div>
      ) : null}
    </div>
  );
}
