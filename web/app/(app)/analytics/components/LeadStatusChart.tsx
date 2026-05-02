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
  new: "#6366f1",
  contacted: "#3b82f6",
  qualified: "#f59e0b",
  converted: "#22c55e",
  lost: "#9ca3af",
};

const LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  converted: "Converted",
  lost: "Lost",
};

export function LeadStatusChart({
  leads,
}: {
  leads: AnalyticsSummary["leads"];
}) {
  const data = [
    { key: "new", name: LABELS.new, value: leads.by_status.new },
    { key: "contacted", name: LABELS.contacted, value: leads.by_status.contacted },
    { key: "qualified", name: LABELS.qualified, value: leads.by_status.qualified },
    { key: "converted", name: LABELS.converted, value: leads.by_status.converted },
    { key: "lost", name: LABELS.lost, value: leads.by_status.lost },
  ];

  const total = data.reduce((s, d) => s + d.value, 0);
  const empty = total === 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <h2 className="text-sm font-semibold text-slate-900">Leads by status</h2>
      <p className="mt-1 text-xs text-slate-400">Pipeline distribution</p>
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
                innerRadius={52}
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
