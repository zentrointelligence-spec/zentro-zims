"use client";

import { CheckSquare } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { TaskForm } from "./TaskForm";
import { TaskRowActions } from "./TaskRowActions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { DataTable } from "@/components/zims/data-table";
import { EmptyState } from "@/components/zims/empty-state";
import { PageFade } from "@/components/zims/PageFade";
import { StatusChip } from "@/components/zims/status-chip";
import type { Task, TaskStatus, TaskType } from "@/lib/schemas";
import { cn, formatDate } from "@/lib/utils";

function typePillClass(type: TaskType): string {
  switch (type) {
    case "followup":
      return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900";
    case "renewal":
      return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900";
    case "call":
      return "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-900";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
  }
}

function typeLabel(type: TaskType): string {
  switch (type) {
    case "followup":
      return "Follow-up";
    case "renewal":
      return "Renewal";
    case "call":
      return "Call";
    default:
      return "Other";
  }
}

function dueKey(due: string): string {
  return due.slice(0, 10);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(due: string, status: TaskStatus): boolean {
  if (status !== "pending" && status !== "in_progress") return false;
  return dueKey(due) < todayKey();
}

export function TasksTable({
  tasks,
  page,
  pages,
  total,
  pageSize,
  autoOpenCreate,
}: {
  tasks: Task[];
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  autoOpenCreate?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [navPending, startNav] = useTransition();
  const [createOpen, setCreateOpen] = useState(() => Boolean(autoOpenCreate));
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [optimistic, setOptimistic] = useState<Record<number, TaskStatus>>({});

  useEffect(() => {
    if (!autoOpenCreate) return;
    router.replace("/tasks", { scroll: false });
  }, [autoOpenCreate, router]);

  useKeyboardShortcut(
    "n",
    () => setCreateOpen(true),
    !createOpen && editTask === null,
  );

  function displayStatus(task: Task): TaskStatus {
    return optimistic[task.id] ?? task.status;
  }

  function applyOptimistic(id: number, status: TaskStatus) {
    setOptimistic((o) => ({ ...o, [id]: status }));
  }

  function clearOptimistic(id: number) {
    setOptimistic((o) => {
      const n = { ...o };
      delete n[id];
      return n;
    });
  }

  function go(next: number) {
    if (next < 1 || next > pages || navPending) return;
    startNav(() => {
      const p = new URLSearchParams(params);
      if (next === 1) p.delete("page");
      else p.set("page", String(next));
      router.push(`/tasks?${p.toString()}`);
    });
  }

  const start_ = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <PageFade>
      <div className="space-y-4">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg sm:max-w-xl" showCloseButton>
            <DialogHeader>
              <DialogTitle>New task</DialogTitle>
              <DialogDescription>
                Add a manual task for your team. Renewals can also create tasks
                automatically.
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              mode="create"
              onSuccess={() => setCreateOpen(false)}
              onCancel={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={editTask !== null} onOpenChange={(o) => !o && setEditTask(null)}>
          <DialogContent className="max-w-lg sm:max-w-xl" showCloseButton>
            <DialogHeader>
              <DialogTitle>Edit task</DialogTitle>
              <DialogDescription>Update fields and save your changes.</DialogDescription>
            </DialogHeader>
            {editTask ? (
              <TaskForm
                mode="edit"
                task={editTask}
                onSuccess={() => setEditTask(null)}
                onCancel={() => setEditTask(null)}
              />
            ) : null}
          </DialogContent>
        </Dialog>

        <div className="overflow-x-auto rounded-md border">
          {tasks.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No tasks yet"
                description="Tasks are created automatically for renewals, or you can add them manually"
                icon={CheckSquare}
                action={
                  <Button type="button" onClick={() => setCreateOpen(true)}>
                    New task
                  </Button>
                }
              />
            </div>
          ) : (
            <DataTable
              columns={[
                "Title",
                "Type",
                "Due date",
                "Status",
                "Created",
                "Actions",
              ]}
              columnHeaderClassName={[
                "",
                "hidden md:table-cell",
                "",
                "",
                "hidden md:table-cell",
                "text-right",
              ]}
            >
              {tasks.map((task) => {
                const ds = displayStatus(task);
                const overdue = isOverdue(task.due_date, ds);
                return (
                  <TableRow key={task.id}>
                    <TableCell className="px-0 py-2.5 align-middle text-sm font-semibold">
                      {task.title}
                    </TableCell>
                    <TableCell className="hidden px-0 py-2.5 align-middle md:table-cell">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-[12px] font-medium capitalize transition-colors duration-150 ease-in-out",
                          typePillClass(task.type),
                        )}
                      >
                        {typeLabel(task.type)}
                      </span>
                    </TableCell>
                    <TableCell className="px-0 py-2.5 align-middle text-sm">
                      <div className="flex flex-wrap items-center gap-2 whitespace-nowrap">
                        <span>{formatDate(task.due_date)}</span>
                        {overdue ? (
                          <span className="inline-flex rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white">
                            Overdue
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-0 py-2.5 align-middle">
                      <StatusChip status={ds} kind="task" />
                    </TableCell>
                    <TableCell className="hidden px-0 py-2.5 align-middle text-sm text-muted-foreground md:table-cell">
                      {formatDate(task.created_at)}
                    </TableCell>
                    <TableCell className="px-0 py-2.5 align-middle text-right">
                      <TaskRowActions
                        task={task}
                        displayStatus={ds}
                        onOptimisticStatus={applyOptimistic}
                        onClearOptimistic={clearOptimistic}
                        onEdit={(t) => setEditTask(t)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </DataTable>
          )}
        </div>

        {tasks.length > 0 ? (
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
        ) : null}
      </div>
    </PageFade>
  );
}
