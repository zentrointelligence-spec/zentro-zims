"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";

import { EmptyState } from "@/components/zims/empty-state";
import { StatusChip } from "@/components/zims/status-chip";
import type { Lead } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const AVATAR_STYLES = [
  "bg-brand-500",
  "bg-brand-600",
  "bg-teal-500",
  "bg-green-600",
  "bg-amber-500",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function avatarClass(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % AVATAR_STYLES.length;
  return AVATAR_STYLES[h] ?? AVATAR_STYLES[0]!;
}

export function RecentLeads({ leads }: { leads: Lead[] }) {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Recent leads</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {leads.length}
          </span>
        </div>
        <Link
          href="/leads"
          className="text-xs font-medium text-brand-500 transition-colors hover:text-brand-600"
        >
          View all →
        </Link>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          title="No leads yet"
          description="Create a lead to see it appear here."
          icon={Target}
          className="min-h-[200px] py-8"
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {leads.map((lead) => (
            <li key={lead.id}>
              <button
                type="button"
                onClick={() => router.push("/leads")}
                className="flex w-full cursor-pointer items-center gap-3 py-0 text-left transition-colors hover:bg-slate-50"
                style={{ minHeight: 48 }}
              >
                <div
                  className={cn(
                    "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white",
                    avatarClass(lead.name),
                  )}
                >
                  {initials(lead.name)}
                </div>
                <div className="min-w-0 flex-1 py-2">
                  <p className="truncate text-[13px] font-medium text-slate-900">{lead.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">
                    {lead.insurance_type}
                  </p>
                </div>
                <div className="shrink-0 py-2">
                  <StatusChip status={lead.status} kind="lead" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
