"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

import { DataTable } from "@/components/zims/data-table";
import { PageFade } from "@/components/zims/PageFade";
import { EmptyState } from "@/components/zims/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Policy } from "@/lib/schemas";
import { cn, daysUntil, formatDate } from "@/lib/utils";

function DaysLeftChip({ days }: { days: number }) {
  let tone: "rose" | "amber" | "emerald" | "slate";
  if (days <= 7) tone = "rose";
  else if (days <= 14) tone = "amber";
  else if (days <= 30) tone = "emerald";
  else tone = "slate";

  const label =
    days < 0 ? "Past due" : days === 0 ? "Today" : `${days}d`;

  const styles: Record<typeof tone, string> = {
    rose: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
    amber:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
    slate:
      "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums",
        styles[tone],
      )}
    >
      {label}
    </span>
  );
}

export function UpcomingRenewals({ policies }: { policies: Policy[] }) {
  return (
    <PageFade>
    <Card className="rounded-lg border bg-card p-5 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 p-0 pb-3">
        <div>
          <CardTitle className="text-sm font-medium">
            Upcoming renewals
          </CardTitle>
          <CardDescription className="sr-only">
            Policies flagged for renewal
          </CardDescription>
        </div>
        <Link
          href="/policies"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          View all policies
        </Link>
      </CardHeader>
      <CardContent className="p-0 pt-1">
        {policies.length === 0 ? (
          <EmptyState
            title="No renewals due"
            description="Policies approaching expiry will appear here."
            icon={FileText}
          />
        ) : (
          <DataTable
            columns={["Policy Number", "Policy Type", "Expiry Date", "Days Left"]}
            columnHeaderClassName={["", "hidden md:table-cell", "", ""]}
          >
            {policies.map((policy) => {
              const left = daysUntil(policy.expiry_date);
              return (
                <TableRow
                  key={policy.id}
                  className="border-b border-border/50 last:border-b-0 hover:bg-muted/40"
                >
                  <TableCell className="px-0 py-2.5 font-medium text-foreground">
                    {policy.policy_number}
                  </TableCell>
                  <TableCell className="hidden px-0 py-2.5 text-muted-foreground md:table-cell">
                    {policy.policy_type}
                  </TableCell>
                  <TableCell className="px-0 py-2.5 text-muted-foreground tabular-nums">
                    {formatDate(policy.expiry_date)}
                  </TableCell>
                  <TableCell className="px-0 py-2.5">
                    <DaysLeftChip days={left} />
                  </TableCell>
                </TableRow>
              );
            })}
          </DataTable>
        )}
      </CardContent>
    </Card>
    </PageFade>
  );
}
