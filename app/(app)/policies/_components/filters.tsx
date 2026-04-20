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

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "renewal_due", label: "Renewal due" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

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
        <Select
          value={currentStatus || "all"}
          onValueChange={setStatus}
          disabled={pending}
        >
          <SelectTrigger size="sm" className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
