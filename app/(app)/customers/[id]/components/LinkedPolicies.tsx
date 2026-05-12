"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TableCell, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/zims/data-table";
import { EmptyState } from "@/components/zims/empty-state";
import { StatusChip } from "@/components/zims/status-chip";
import type { Policy } from "@/lib/schemas";
import { cn, daysUntil, formatDate } from "@/lib/utils";

function DaysCell({ policy }: { policy: Policy }) {
  const days = daysUntil(policy.expiry_date);
  const expired =
    policy.status === "expired" || days < 0;

  if (expired) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-800",
          "dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
        )}
      >
        Expired
      </span>
    );
  }

  if (days > 30) {
    return <span className="text-muted-foreground">—</span>;
  }

  let tone: "rose" | "amber" | "emerald";
  if (days <= 7) tone = "rose";
  else if (days <= 14) tone = "amber";
  else tone = "emerald";

  const styles: Record<typeof tone, string> = {
    rose: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
    amber:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  };

  const label = days === 0 ? "Today" : `${days}d`;

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

export function LinkedPolicies({
  customerId,
  policies,
}: {
  customerId: number;
  policies: Policy[];
}) {
  return (
    <Card className="rounded-lg border bg-card p-6 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 p-0 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-medium">Policies</CardTitle>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
              {policies.length}
            </span>
          </div>
          <CardDescription className="sr-only">
            Policies linked to this customer
          </CardDescription>
        </div>
        <Button nativeButton={false} render={<Link href={`/policies?customer_id=${customerId}`} />} size="sm">
          Issue policy →
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {policies.length === 0 ? (
          <EmptyState
            title="No policies linked"
            description="Issue a policy for this customer to track their coverage"
            icon={FileText}
            action={
              <Link
                href="/policies?create=1"
                className={buttonVariants({ size: "sm" })}
              >
                Issue policy
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <DataTable
              columns={[
                "Policy Number",
                "Policy Type",
                "Status",
                "Expiry Date",
                "Days left",
              ]}
              columnHeaderClassName={["", "hidden md:table-cell", "", "", ""]}
            >
              {policies.map((p) => (
                <TableRow
                  key={p.id}
                  className={cn(
                    "border-b border-border/50 last:border-0",
                    p.status === "active" && "border-l-2 border-l-green-300",
                    p.status === "renewal_due" && "border-l-2 border-l-amber-300",
                    p.status === "expired" && "border-l-2 border-l-red-300",
                    p.status === "cancelled" && "border-l-2 border-l-slate-300",
                  )}
                >
                  <TableCell className="px-0 py-2.5 font-medium">
                    {p.policy_number}
                  </TableCell>
                  <TableCell className="hidden px-0 py-2.5 text-muted-foreground md:table-cell">
                    {p.policy_type}
                  </TableCell>
                  <TableCell className="px-0 py-2.5">
                    <StatusChip status={p.status} kind="policy" />
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-0 py-2.5 tabular-nums",
                      daysUntil(p.expiry_date) < 0
                        ? "text-red-600"
                        : daysUntil(p.expiry_date) <= 30
                          ? "text-amber-600"
                          : "text-green-600",
                    )}
                  >
                    {formatDate(p.expiry_date)}
                  </TableCell>
                  <TableCell className="px-0 py-2.5">
                    <DaysCell policy={p} />
                  </TableCell>
                </TableRow>
              ))}
            </DataTable>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
