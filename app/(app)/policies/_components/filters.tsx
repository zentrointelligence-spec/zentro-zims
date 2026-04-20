"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "renewal_due", label: "Renewal due" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

const DOT: Record<string, string> = {
  all: "bg-slate-300",
  active: "bg-green-500",
  renewal_due: "bg-amber-500",
  expired: "bg-red-500",
  cancelled: "bg-slate-400",
};

export function PolicyFilters({
  currentStatus,
  pageSize,
}: {
  currentStatus: string;
  pageSize: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  function setStatus(next: string | null) {
    start(() => {
      const p = new URLSearchParams(params);
      if (!next || next === "all") p.delete("status");
      else p.set("status", next);
      p.delete("page"); // reset to first page
      router.push(`/policies?${p.toString()}`);
    });
  }

  function setPageSize(next: string | null) {
    start(() => {
      const p = new URLSearchParams(params);
      if (next) p.set("page_size", next);
      p.delete("page");
      router.push(`/policies?${p.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status</span>
        <div className="inline-flex flex-wrap items-center gap-1 rounded-[10px] border border-slate-200 bg-slate-50 p-1">
          {STATUS_OPTIONS.map((o) => {
            const active = (currentStatus || "all") === o.value;
            return (
              <button
                key={o.value}
                type="button"
                disabled={pending}
                onClick={() => setStatus(o.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[8px] px-[14px] py-[6px] text-[13px] font-medium transition-colors",
                  active
                    ? "border border-brand-200 bg-white text-brand-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", DOT[o.value])} />
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={setPageSize}
          disabled={pending}
        >
          <SelectTrigger size="sm" className="w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentStatus && currentStatus !== "all" ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStatus("all")}
          disabled={pending}
        >
          Clear
        </Button>
      ) : null}
    </div>
  );
}
