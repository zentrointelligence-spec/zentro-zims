"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import type { TaskStatus, TaskType } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

const TYPE_FILTERS: { value: TaskType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "followup", label: "Follow-up" },
  { value: "renewal", label: "Renewal" },
  { value: "call", label: "Call" },
  { value: "other", label: "Other" },
];

export function TaskFilters({
  currentStatus,
  currentType,
}: {
  currentStatus: TaskStatus | "all";
  currentType: TaskType | "all";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  function setStatus(next: TaskStatus | "all") {
    start(() => {
      const p = new URLSearchParams(params);
      if (next === "all") p.delete("status");
      else p.set("status", next);
      p.delete("page");
      router.push(`/tasks?${p.toString()}`);
    });
  }

  function setType(next: TaskType | "all") {
    start(() => {
      const p = new URLSearchParams(params);
      if (next === "all") p.delete("type");
      else p.set("type", next);
      p.delete("page");
      router.push(`/tasks?${p.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Status</p>
        <div className="inline-flex flex-wrap gap-1 rounded-[10px] border border-slate-200 bg-slate-50 p-1">
          {STATUS_FILTERS.map((f) => {
            const active = currentStatus === f.value;
            return (
              <button
                key={f.value}
                type="button"
                disabled={pending}
                onClick={() => setStatus(f.value)}
                className={cn(
                  "rounded-[8px] px-[14px] py-[6px] text-[13px] font-medium transition-all duration-150 ease-in-out",
                  active &&
                    "border border-brand-200 bg-white text-brand-600 shadow-sm",
                  !active && "text-slate-500 hover:text-slate-700",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Type</p>
        <div className="inline-flex flex-wrap gap-1 rounded-[10px] border border-slate-200 bg-slate-50 p-1">
          {TYPE_FILTERS.map((f) => {
            const active = currentType === f.value;
            return (
              <button
                key={f.value}
                type="button"
                disabled={pending}
                onClick={() => setType(f.value)}
                className={cn(
                  "rounded-[8px] px-[14px] py-[6px] text-[13px] font-medium transition-all duration-150 ease-in-out",
                  active &&
                    "border border-brand-200 bg-white text-brand-600 shadow-sm",
                  !active && "text-slate-500 hover:text-slate-700",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
