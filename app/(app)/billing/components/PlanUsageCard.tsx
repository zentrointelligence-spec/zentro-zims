"use client";

import Link from "next/link";

import type { PlanLimits, PlanUsage } from "@/lib/schemas";

type RowKey = "users" | "leads" | "policies";

const ROWS: { key: RowKey; label: string; maxKey: keyof PlanLimits; curKey: keyof PlanUsage }[] =
  [
    { key: "users", label: "Users", maxKey: "max_users", curKey: "current_users" },
    { key: "leads", label: "Leads", maxKey: "max_leads", curKey: "current_leads" },
    {
      key: "policies",
      label: "Policies",
      maxKey: "max_policies",
      curKey: "current_policies",
    },
  ];

function barColor(pct: number, unlimited: boolean): string {
  if (unlimited) return "bg-muted-foreground/25";
  if (pct >= 100) return "bg-red-500";
  if (pct >= 80) return "bg-amber-500";
  return "bg-indigo-600";
}

export function PlanUsageCard({
  limits,
  usage,
}: {
  limits: PlanLimits;
  usage: PlanUsage;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 text-card-foreground shadow-card">
      <h2 className="text-lg font-semibold tracking-tight">Plan usage</h2>
      <div className="mt-4 space-y-5">
        {ROWS.map((row) => {
          const max = limits[row.maxKey];
          const cur = usage[row.curKey];
          const unlimited = max === null;
          const pct = unlimited ? 0 : Math.min(100, Math.round((cur / max) * 100));
          const atLimit = !unlimited && cur >= max;

          return (
            <div
              key={row.key}
              className={
                atLimit
                  ? "rounded-md border border-red-200 bg-red-50/60 p-3 dark:border-red-900/50 dark:bg-red-950/20"
                  : ""
              }
            >
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-foreground">{row.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {cur} / {unlimited ? "Unlimited" : max}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${barColor(pct, unlimited)}`}
                  style={{
                    width: unlimited ? "0%" : `${pct}%`,
                  }}
                />
              </div>
              {atLimit ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-red-600/15 px-2 py-0.5 font-semibold text-red-800 dark:text-red-200">
                    Limit reached
                  </span>
                  <Link
                    href="/billing"
                    className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
                  >
                    Upgrade
                  </Link>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
