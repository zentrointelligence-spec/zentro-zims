"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pages,
  total,
  pageSize,
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  function go(next: number) {
    if (next < 1 || next > pages || pending) return;
    start(() => {
      const p = new URLSearchParams(params);
      if (next === 1) p.delete("page");
      else p.set("page", String(next));
      router.push(`/policies?${p.toString()}`);
    });
  }

  const start_ = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        {total === 0
          ? "No results"
          : `Showing ${start_}–${end} of ${total}`}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || pending}
          onClick={() => go(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <span className="tabular-nums text-muted-foreground">
          Page {page} / {Math.max(pages, 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages || pending}
          onClick={() => go(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
