"use client";

import { cn } from "@/lib/utils";
import type { PlanTier } from "@/lib/schemas";

export function PlanChip({ plan }: { plan: PlanTier }) {
  const label =
    plan === "growth" ? "Growth" : plan === "pro" ? "Pro" : "Starter";
  return (
    <span
      className={cn(
        "mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        plan === "starter" && "bg-muted text-muted-foreground",
        plan === "growth" &&
          "bg-indigo-600/15 text-indigo-800 dark:text-indigo-200",
        plan === "pro" &&
          "bg-violet-600/15 text-violet-800 dark:text-violet-200",
      )}
    >
      {label}
    </span>
  );
}
