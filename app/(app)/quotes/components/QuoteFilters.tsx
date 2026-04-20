"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { QuoteStatus } from "@/lib/schemas";

const FILTERS: { value: QuoteStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

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
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => {
        const active = currentStatus === f.value;
        return (
          <Button
            key={f.value}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            disabled={pending}
            onClick={() => setFilter(f.value)}
            className="capitalize"
          >
            {f.label}
          </Button>
        );
      })}
    </div>
  );
}
