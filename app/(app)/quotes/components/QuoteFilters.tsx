"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import type { QuoteStatus } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const FILTERS: { value: QuoteStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const DOT: Record<string, string> = {
  all: "bg-slate-300",
  draft: "bg-slate-400",
  sent: "bg-blue-500",
  accepted: "bg-green-500",
  rejected: "bg-red-500",
};

export function QuoteFilters({
  currentStatus,
}: {
  currentStatus: QuoteStatus | "all";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  function setFilter(next: QuoteStatus | "all") {
    start(() => {
      const p = new URLSearchParams(params);
      if (next === "all") p.delete("status");
      else p.set("status", next);
      p.delete("page");
      router.push(`/quotes?${p.toString()}`);
    });
  }

  return (
    <div className="inline-flex flex-wrap gap-1 rounded-[10px] border border-slate-200 bg-slate-50 p-1">
      {FILTERS.map((f) => {
        const active = currentStatus === f.value;
        return (
          <button
            key={f.value}
            type="button"
            disabled={pending}
            onClick={() => setFilter(f.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[8px] px-[14px] py-[6px] text-[13px] font-medium capitalize transition-colors",
              active
                ? "border border-brand-200 bg-white text-brand-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", DOT[f.value])} />
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
