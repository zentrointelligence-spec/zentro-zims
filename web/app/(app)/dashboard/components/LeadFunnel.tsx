"use client";

import type { Lead, LeadStatus } from "@/lib/schemas";

const ORDER: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
];

const LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  converted: "Converted",
  lost: "Lost",
};

const FILL: Record<LeadStatus, string> = {
  new: "bg-brand-400",
  contacted: "bg-blue-400",
  qualified: "bg-amber-400",
  converted: "bg-green-500",
  lost: "bg-slate-300",
};

export function LeadFunnel({
  leads,
  totalLeads,
}: {
  leads: Lead[];
  /** Agency-wide total from the same list response (dashboard passes `leadsRecent.total`). */
  totalLeads: number;
}) {
  const counts: Record<LeadStatus, number> = {
    new: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    lost: 0,
  };
  for (const lead of leads) {
    counts[lead.status] += 1;
  }
  const denom = Math.max(totalLeads, 1);

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-card">
      <h2 className="text-sm font-semibold text-slate-900">Lead pipeline</h2>

      <div className="mt-4 space-y-3">
        {ORDER.map((status) => {
          const count = counts[status];
          const pct = (count / denom) * 100;
          return (
            <div key={status} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs font-medium text-slate-600">
                {LABELS[status]}
              </span>
              <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-[4px] bg-slate-100">
                <div
                  className={`absolute left-0 top-0 h-full rounded-[4px] ${FILL[status]}`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-700">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        {totalLeads.toLocaleString()} total leads
      </p>
    </div>
  );
}
