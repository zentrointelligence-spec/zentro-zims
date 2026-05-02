"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AnalyticsMonthlyRow } from "@/lib/schemas";

import { chartMonthLabel, formatRM } from "../lib/format";

type Row = AnalyticsMonthlyRow & { label: string };

export function MonthlyTrendChart({ monthly }: { monthly: AnalyticsMonthlyRow[] }) {
  const data: Row[] = monthly.map((row) => ({
    ...row,
    label: chartMonthLabel(row.month),
  }));

  const empty =
    data.length === 0 ||
    data.every(
      (d) =>
        d.leads_created === 0 && d.policies_created === 0 && d.revenue === 0,
    );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <h2 className="text-sm font-semibold text-slate-900">Monthly activity</h2>
      <p className="mt-1 text-xs text-slate-400">Revenue and lead momentum vs last month</p>
      <div className="relative mt-3 min-h-[280px] w-full">
        {empty ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  `RM ${Number(v).toLocaleString("en-MY", { maximumFractionDigits: 0 })}`
                }
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload as Row | undefined;
                  if (!row) return null;
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-modal">
                      <p className="mb-1 font-medium text-foreground">{label}</p>
                      <p className="text-muted-foreground">
                        Leads created:{" "}
                        <span className="font-medium text-foreground">
                          {row.leads_created.toLocaleString()}
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        Policies created:{" "}
                        <span className="font-medium text-foreground">
                          {row.policies_created.toLocaleString()}
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        Revenue:{" "}
                        <span className="font-medium text-foreground">
                          {formatRM(row.revenue)}
                        </span>
                      </p>
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (
                  <span className="text-muted-foreground">{value}</span>
                )}
              />
              <Bar
                yAxisId="left"
                dataKey="policies_created"
                name="Policies created"
                fill="#e2e8f0"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="leads_created"
                name="Leads"
                stroke="#14b8a6"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={{ r: 2, fill: "#14b8a6" }}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3, fill: "#6366f1" }}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
