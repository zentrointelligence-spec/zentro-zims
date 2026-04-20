"use client";

import { cn } from "@/lib/utils";
import type { AnalyticsSummary } from "@/lib/schemas";

import { formatRM } from "../lib/format";

type KpiDef = {
  label: string;
  value: string;
  accent: string;
};

export function SummaryKpis({ summary }: { summary: AnalyticsSummary }) {
  const items: KpiDef[] = [
    {
      label: "Total Leads",
      value: summary.leads.total.toLocaleString(),
      accent: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "Conversion Rate",
      value: `${summary.leads.conversion_rate.toFixed(2)}%`,
      accent: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Total Customers",
      value: summary.customers.total.toLocaleString(),
      accent: "text-teal-600 dark:text-teal-400",
    },
    {
      label: "Active Policies",
      value: summary.policies.by_status.active.toLocaleString(),
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Total Premium Value",
      value: formatRM(summary.policies.total_premium_value),
      accent: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Renewal Due This Month",
      value: summary.renewals_due_this_month.toLocaleString(),
      accent: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Overdue Tasks",
      value: summary.tasks.overdue.toLocaleString(),
      accent: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Expired This Month",
      value: summary.expired_this_month.toLocaleString(),
      accent: "text-slate-600 dark:text-slate-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-md bg-secondary p-4 shadow-none"
        >
          <p className="text-[13px] text-muted-foreground">{item.label}</p>
          <p
            className={cn(
              "mt-1 text-[28px] font-medium leading-none tracking-tight tabular-nums",
              item.accent,
            )}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
