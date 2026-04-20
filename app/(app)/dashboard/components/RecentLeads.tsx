"use client";

import Link from "next/link";
import { Target } from "lucide-react";

import { DataTable } from "@/components/zims/data-table";
import { PageFade } from "@/components/zims/PageFade";
import { EmptyState } from "@/components/zims/empty-state";
import { StatusChip } from "@/components/zims/status-chip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Lead } from "@/lib/schemas";
import { formatDate } from "@/lib/utils";

export function RecentLeads({ leads }: { leads: Lead[] }) {
  return (
    <PageFade>
    <Card className="rounded-lg border bg-card p-5 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 p-0 pb-3">
        <div>
          <CardTitle className="text-sm font-medium">Recent leads</CardTitle>
          <CardDescription className="sr-only">
            Latest leads in your pipeline
          </CardDescription>
        </div>
        <Link
          href="/leads"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          View all leads
        </Link>
      </CardHeader>
      <CardContent className="p-0 pt-1">
        {leads.length === 0 ? (
          <EmptyState
            title="No leads yet"
            description="Create a lead to see it appear here."
            icon={Target}
          />
        ) : (
          <DataTable
            columns={["Name", "Insurance Type", "Status", "Created"]}
            columnHeaderClassName={[
              "",
              "hidden md:table-cell",
              "",
              "hidden md:table-cell",
            ]}
          >
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="border-b border-border/50 last:border-b-0 hover:bg-muted/40"
              >
                <TableCell className="px-0 py-2.5 font-medium text-foreground">
                  {lead.name}
                </TableCell>
                <TableCell className="hidden px-0 py-2.5 text-muted-foreground md:table-cell">
                  {lead.insurance_type}
                </TableCell>
                <TableCell className="px-0 py-2.5">
                  <StatusChip status={lead.status} kind="lead" />
                </TableCell>
                <TableCell className="hidden px-0 py-2.5 text-muted-foreground tabular-nums md:table-cell">
                  {formatDate(lead.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </CardContent>
    </Card>
    </PageFade>
  );
}
