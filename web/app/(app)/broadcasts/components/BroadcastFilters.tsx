"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { BroadcastStatus } from "@/lib/schemas";

type FilterKey = "all" | BroadcastStatus;

const PILLS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sending", label: "Sending" },
  { key: "sent", label: "Sent" },
  { key: "failed", label: "Failed" },
];

export function BroadcastFilters({ currentStatus }: { currentStatus: FilterKey }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  function setFilter(next: FilterKey) {
    start(() => {
      const p = new URLSearchParams(params);
      if (next === "all") {
        p.delete("status");
      } else {
        p.set("status", next);
      }
      p.delete("page");
      router.push(`/broadcasts?${p.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PILLS.map((pill) => {
        const active =
          pill.key === "all"
            ? currentStatus === "all"
            : currentStatus === pill.key;
        return (
          <Button
            key={pill.key}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            disabled={pending}
            onClick={() => setFilter(pill.key)}
          >
            {pill.label}
          </Button>
        );
      })}
    </div>
  );
}
