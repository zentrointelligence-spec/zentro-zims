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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
        >
          <p className="text-[12px] font-medium text-slate-500">{item.label}</p>
          <p
            className={cn(
              "mt-2 text-[28px] font-extrabold leading-none tracking-tight tabular-nums",
              item.accent,
            )}
          >
            {item.value}
          </p>
          <div className="mt-4 h-[3px] overflow-hidden rounded-sm bg-slate-100">
            <div className="h-full w-2/3 rounded-sm bg-brand-400" />
          </div>
        </div>
      ))}
    </div>
  );
}
