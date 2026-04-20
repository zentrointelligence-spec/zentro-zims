"use client";

import { Megaphone } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { BroadcastRowActions } from "./BroadcastRowActions";
import { BroadcastStatusChip } from "./BroadcastStatusChip";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/zims/empty-state";
import { PageFade } from "@/components/zims/PageFade";
import type { Broadcast } from "@/lib/schemas";
import { formatDate } from "@/lib/utils";

function segmentLabel(b: Broadcast): string {
  switch (b.target_segment) {
    case "all":
      return "All customers";
    case "renewal_due":
      return "Renewal due";
    case "expired":
      return "Expired policies";
    case "birthday_this_month":
      return "Birthdays this month";
    case "by_policy_type":
      return `Policy type: ${b.policy_type_filter?.trim() || "—"}`;
    default:
      return b.target_segment;
  }
}

function sentFailedLabel(b: Broadcast): string {
  if (b.status === "sent" || b.status === "failed") {
    return `${b.sent_count.toLocaleString()} sent, ${b.failed_count.toLocaleString()} failed`;
  }
  return "—";
}

export function BroadcastsTable({
  broadcasts,
  page,
  pages,
  total,
  pageSize,
}: {
  broadcasts: Broadcast[];
  page: number;
  pages: number;
  total: number;
  pageSize: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [navPending, startNav] = useTransition();

  function go(next: number) {
    if (next < 1 || next > pages || navPending) return;
    startNav(() => {
      const p = new URLSearchParams(params);
      if (next === 1) p.delete("page");
      else p.set("page", String(next));
      router.push(`/broadcasts?${p.toString()}`);
    });
  }

  const start_ = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <PageFade>
      <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Segment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Sent / Failed</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {broadcasts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    title="No broadcasts yet"
                    description="Send a WhatsApp message to a segment of your customers"
                    icon={Megaphone}
                    action={
                      <Link
                        href="/broadcasts?create=1"
                        className={buttonVariants({ variant: "default" })}
                      >
                        New broadcast
                      </Link>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              broadcasts.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="hidden max-w-[220px] text-sm text-muted-foreground md:table-cell">
                    {segmentLabel(b)}
                  </TableCell>
                  <TableCell>
                    <BroadcastStatusChip status={b.status} />
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground md:table-cell">
                    {sentFailedLabel(b)}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground md:table-cell">
                    {formatDate(b.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <BroadcastRowActions broadcast={b} />
                  </TableCell>
                </TableRow>
              )))}
          </TableBody>
        </Table>
      </div>

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
            disabled={page <= 1 || navPending}
            onClick={() => go(page - 1)}
          >
            Prev
          </Button>
          <span className="tabular-nums text-muted-foreground">
            Page {page} / {Math.max(pages, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages || navPending}
            onClick={() => go(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      </div>
    </PageFade>
  );
}
