"use client";

import {
  FileCheck,
  RefreshCw,
  UserCheck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type DashboardKpiMetrics = {
  totalLeads: number;
  totalCustomers: number;
  activePolicies: number;
  renewalDue: number;
};

const MAX = {
  totalLeads: 500,
  totalCustomers: 300,
  activePolicies: 300,
  renewalDue: 50,
} as const;

type CardDef = {
  key: keyof DashboardKpiMetrics;
  label: string;
  icon: typeof Users;
  iconWrap: string;
  bar: string;
};

const CARDS: CardDef[] = [
  {
    key: "totalLeads",
    label: "Leads",
    icon: Users,
    iconWrap: "bg-brand-50 text-brand-500",
    bar: "bg-brand-400",
  },
  {
    key: "totalCustomers",
    label: "Customers",
    icon: UserCheck,
    iconWrap: "bg-teal-50 text-teal-600",
    bar: "bg-teal-500",
  },
  {
    key: "activePolicies",
    label: "Active policies",
    icon: FileCheck,
    iconWrap: "bg-green-50 text-green-600",
    bar: "bg-green-500",
  },
  {
    key: "renewalDue",
    label: "Renewals due",
    icon: RefreshCw,
    iconWrap: "bg-amber-50 text-amber-600",
    bar: "bg-amber-500",
  },
];

function progressPct(value: number, max: number): number {
  return Math.min(100, Math.max(0, (value / max) * 100));
}

export function KpiCards({ metrics }: { metrics: DashboardKpiMetrics }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {CARDS.map((card) => {
        const value = metrics[card.key];
        const max = MAX[card.key];
        const pct = progressPct(value, max);
        const Icon = card.icon;
        const isRenewals = card.key === "renewalDue";
        const showActiveTrend = !isRenewals && value > 0;
        const showRenewalTrend = isRenewals && value > 0;

        return (
          <div
            key={card.key}
            className={cn(
              "rounded-[14px] border border-[#e2e8f0] bg-white p-5 shadow-card",
              "transition-[transform,box-shadow] duration-200",
              "hover:-translate-y-0.5 hover:shadow-card-hover",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]",
                  card.iconWrap,
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </div>
              {showActiveTrend ? (
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                  ↑ Active
                </span>
              ) : showRenewalTrend ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  ! Due
                </span>
              ) : null}
            </div>
            <p className="mt-4 text-[30px] font-extrabold tabular-nums text-slate-900">
              {value.toLocaleString()}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">{card.label}</p>
            <div className="mt-4 h-[3px] overflow-hidden rounded-sm bg-slate-100">
              <div
                className={cn("h-full rounded-sm transition-[width] duration-300", card.bar)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
