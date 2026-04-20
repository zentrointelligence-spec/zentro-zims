"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

export function LeadFilters({
  currentStatus,
  currentSearch,
  pageSize,
}: {
  currentStatus: string;
  currentSearch: string;
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
      p.delete("page");
      router.push(`/leads?${p.toString()}`);
    });
  }

  function setPageSize(next: string | null) {
    start(() => {
      const p = new URLSearchParams(params);
      if (next) p.set("page_size", next);
      p.delete("page");
      router.push(`/leads?${p.toString()}`);
    });
  }

  function applySearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = String(fd.get("search") ?? "").trim();
    start(() => {
      const p = new URLSearchParams(params);
      if (q) p.set("search", q);
      else p.delete("search");
      p.delete("page");
      router.push(`/leads?${p.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <form
        onSubmit={applySearch}
        className="flex w-full max-w-md flex-1 flex-wrap items-end gap-2"
      >
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs text-muted-foreground" htmlFor="lead-search">
            Search name or phone
          </label>
          <Input
            id="lead-search"
            name="search"
            type="search"
            placeholder="Search…"
            defaultValue={currentSearch}
            disabled={pending}
            autoComplete="off"
          />
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          Search
        </Button>
      </form>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Status</span>
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

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Per page</span>
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
            className="mb-0.5"
            onClick={() => setStatus("all")}
            disabled={pending}
          >
            Clear status
          </Button>
        ) : null}
      </div>
    </div>
  );
}
