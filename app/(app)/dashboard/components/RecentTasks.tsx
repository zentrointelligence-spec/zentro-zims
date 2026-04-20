"use client";

import Link from "next/link";
import { CheckSquare } from "lucide-react";

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
import type { Task } from "@/lib/schemas";
import { cn, formatDate } from "@/lib/utils";

function formatTaskType(type: Task["type"]): string {
  const map: Record<Task["type"], string> = {
    followup: "Follow-up",
    renewal: "Renewal",
    call: "Call",
    other: "Other",
  };
  return map[type] ?? type;
}

function isOverdue(task: Task): boolean {
  const due = new Date(task.due_date).getTime();
  if (!Number.isFinite(due)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(due);
  d.setHours(0, 0, 0, 0);
  if (d.getTime() >= today.getTime()) return false;
  return task.status === "pending" || task.status === "in_progress";
}

function OverdueChip() {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-800",
        "dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
      )}
    >
      Overdue
    </span>
  );
}

export function RecentTasks({ tasks }: { tasks: Task[] }) {
  return (
    <PageFade>
    <Card className="rounded-lg border bg-card p-5 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 p-0 pb-3">
        <div>
          <CardTitle className="text-sm font-medium">Open tasks</CardTitle>
          <CardDescription className="sr-only">
            Pending work items for your agency
          </CardDescription>
        </div>
        <Link
          href="/tasks"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          View all tasks
        </Link>
      </CardHeader>
      <CardContent className="p-0 pt-1">
        {tasks.length === 0 ? (
          <EmptyState
            title="No open tasks"
            description="Pending tasks will show up here."
            icon={CheckSquare}
          />
        ) : (
          <DataTable
            columns={["Title", "Type", "Due Date", "Status"]}
            columnHeaderClassName={["", "hidden md:table-cell", "", ""]}
          >
            {tasks.map((task) => {
              const overdue = isOverdue(task);
              return (
                <TableRow
                  key={task.id}
                  className="border-b border-border/50 last:border-b-0 hover:bg-muted/40"
                >
                  <TableCell className="max-w-[200px] truncate px-0 py-2.5 font-medium text-foreground">
                    {task.title}
                  </TableCell>
                  <TableCell className="hidden px-0 py-2.5 text-muted-foreground md:table-cell">
                    {formatTaskType(task.type)}
                  </TableCell>
                  <TableCell className="px-0 py-2.5 text-muted-foreground tabular-nums">
                    {formatDate(task.due_date)}
                  </TableCell>
                  <TableCell className="px-0 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {overdue ? <OverdueChip /> : null}
                      <StatusChip status={task.status} kind="task" />
                    </div>
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
