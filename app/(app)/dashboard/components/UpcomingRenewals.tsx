"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

import { EmptyState } from "@/components/zims/empty-state";
import type { Policy } from "@/lib/schemas";
import { cn, daysUntil, formatDate } from "@/lib/utils";

function urgencyStyles(days: number): {
  circle: string;
  text: string;
  label: string;
} {
  if (days <= 7) {
    return {
      circle: "bg-red-100 text-red-700",
      text: "text-red-600",
      label: days < 0 ? "Past due" : days === 0 ? "Today" : `${days} days left`,
    };
  }
  if (days <= 14) {
    return {
      circle: "bg-amber-100 text-amber-800",
      text: "text-amber-600",
      label: `${days} days left`,
    };
  }
  if (days <= 30) {
    return {
      circle: "bg-green-100 text-green-800",
      text: "text-green-600",
      label: `${days} days left`,
    };
  }
  return {
    circle: "bg-slate-100 text-slate-700",
    text: "text-slate-500",
    label: `${days} days left`,
  };
}

export function UpcomingRenewals({ policies }: { policies: Policy[] }) {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Upcoming renewals</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {policies.length}
          </span>
        </div>
        <Link
          href="/policies"
          className="text-xs font-medium text-brand-500 transition-colors hover:text-brand-600"
        >
          View all →
        </Link>
      </div>

      {policies.length === 0 ? (
        <EmptyState
          title="No renewals due"
          description="Policies approaching expiry will appear here."
          icon={FileText}
          className="min-h-[200px] py-8"
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {policies.map((policy) => {
            const left = daysUntil(policy.expiry_date);
            const u = urgencyStyles(left);
            return (
              <li key={policy.id} className="group">
                <div
                  className="relative flex cursor-default items-center gap-3 py-2"
                  style={{ minHeight: 48 }}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
                      u.circle,
                    )}
                  >
                    {left < 0 ? "!" : left}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-semibold text-slate-700">
                      {policy.policy_number}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{policy.policy_type}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                    <p className="text-[11px] text-slate-500">{formatDate(policy.expiry_date)}</p>
                    <p className={cn("text-[11px] font-medium", u.text)}>{u.label}</p>
                    <button
                      type="button"
                      onClick={() => router.push("/interactions")}
                      className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-brand-100"
                    >
                      Remind →
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
