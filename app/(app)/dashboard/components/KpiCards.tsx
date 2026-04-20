"use client";

import { PageFade } from "@/components/zims/PageFade";
import { cn } from "@/lib/utils";

export type DashboardKpiMetrics = {
  totalLeads: number;
  totalCustomers: number;
  totalPolicies: number;
  activePolicies: number;
  renewalDue: number;
};

const KPI_ITEMS: {
  label: string;
  key: keyof DashboardKpiMetrics;
  accent: string;
}[] = [
  {
    label: "Total Leads",
    key: "totalLeads",
    accent: "text-indigo-600 dark:text-indigo-400",
  },
  {
    label: "Total Customers",
    key: "totalCustomers",
    accent: "text-teal-600 dark:text-teal-400",
  },
  {
    label: "Total Policies",
    key: "totalPolicies",
    accent: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Active Policies",
    key: "activePolicies",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Renewal Due",
    key: "renewalDue",
    accent: "text-amber-600 dark:text-amber-400",
  },
];

export function KpiCards({ metrics }: { metrics: DashboardKpiMetrics }) {
  return (
    <PageFade>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {KPI_ITEMS.map((item) => (
        <div
          key={item.key}
          className="rounded-md bg-secondary p-4 shadow-none"
        >
          <p className="text-[13px] text-muted-foreground">{item.label}</p>
          <p
            className={cn(
              "mt-1 text-[28px] font-medium leading-none tracking-tight tabular-nums",
              item.accent,
            )}
          >
            {metrics[item.key].toLocaleString()}
          </p>
        </div>
      ))}
    </div>
    </PageFade>
  );
}
