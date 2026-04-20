"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/zims/empty-state";
import { StatusChip } from "@/components/zims/status-chip";
import type { Lead } from "@/lib/schemas";
import { cn } from "@/lib/utils";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function LeadSelector({
  leads,
  selectedLeadId,
  onSelect,
}: {
  leads: Lead[];
  selectedLeadId: number | null;
  onSelect: (id: number | null) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return leads;
    return leads.filter((l) => l.name.toLowerCase().includes(s));
  }, [leads, q]);

  return (
    <aside className="flex h-full min-h-[240px] w-full shrink-0 flex-col border-b border-border bg-background md:h-full md:min-h-0 md:w-[320px] md:border-b-0 md:border-r-0">
      <div className="shrink-0 border-b border-border p-3">
        <Input
          placeholder="Search leads…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search leads"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {leads.length === 0 ? (
          <EmptyState
            className="py-8"
            title="No leads found"
            description="Create a lead first to start a conversation"
            icon={MessageCircle}
            action={
              <Link href="/leads?create=1" className={buttonVariants()}>
                New lead
              </Link>
            }
          />
        ) : filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No leads match your search
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((lead) => {
              const active = lead.id === selectedLeadId;
              return (
                <li key={lead.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(lead.id)}
                    className={cn(
                      "flex h-16 w-full items-center gap-3 px-3 text-left transition-colors hover:bg-muted/60",
                      active &&
                        "border-l-[3px] border-l-indigo-600 bg-[#eef2ff] hover:bg-[#eef2ff]",
                      !active && "border-l-[3px] border-l-transparent",
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                      {initials(lead.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="truncate text-[13px] font-medium leading-tight">
                          {lead.name}
                        </span>
                        <StatusChip
                          kind="lead"
                          status={lead.status}
                          className="shrink-0 scale-90"
                        />
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        Last message preview
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
