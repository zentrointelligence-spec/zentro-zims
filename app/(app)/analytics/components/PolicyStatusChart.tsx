"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { AnalyticsSummary } from "@/lib/schemas";

const COLORS: Record<string, string> = {
  active: "#22c55e",
  expired: "#ef4444",
  renewal_due: "#f59e0b",
  cancelled: "#9ca3af",
};

const LABELS: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  renewal_due: "Renewal due",
  cancelled: "Cancelled",
};

export function PolicyStatusChart({
  policies,
}: {
  policies: AnalyticsSummary["policies"];
}) {
  const data = [
    { key: "active", name: LABELS.active, value: policies.by_status.active },
    { key: "expired", name: LABELS.expired, value: policies.by_status.expired },
    {
      key: "renewal_due",
      name: LABELS.renewal_due,
      value: policies.by_status.renewal_due,
    },
    {
      key: "cancelled",
      name: LABELS.cancelled,
      value: policies.by_status.cancelled,
    },
  ];

  const total = data.reduce((s, d) => s + d.value, 0);
  const empty = total === 0;

  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <h2 className="text-sm font-medium text-foreground">Policies by status</h2>
      <div className="relative mt-3 min-h-[280px] w-full">
        {empty ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), "Count"]}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={88}
                paddingAngle={1}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={COLORS[entry.key] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
