"use client";

import Link from "next/link";
import {
  CheckSquare,
  MessageCircle,
  MoreHorizontal,
  Phone,
  RefreshCw,
} from "lucide-react";

import { EmptyState } from "@/components/zims/empty-state";
import { StatusChip } from "@/components/zims/status-chip";
import type { Task } from "@/lib/schemas";
import { cn, formatDate } from "@/lib/utils";

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

function TypeIcon({ type }: { type: Task["type"] }) {
  const map = {
    followup: {
      Icon: MessageCircle,
      wrap: "bg-indigo-100 text-indigo-600",
    },
    renewal: {
      Icon: RefreshCw,
      wrap: "bg-amber-100 text-amber-600",
    },
    call: {
      Icon: Phone,
      wrap: "bg-blue-100 text-blue-600",
    },
    other: {
      Icon: MoreHorizontal,
      wrap: "bg-slate-100 text-slate-600",
    },
  } as const;
  const { Icon, wrap } = map[type];
  return (
    <div
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
        wrap,
      )}
    >
      <Icon className="h-[14px] w-[14px]" aria-hidden />
    </div>
  );
}

export function RecentTasks({ tasks }: { tasks: Task[] }) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Open tasks</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {tasks.length}
          </span>
        </div>
        <Link
          href="/tasks"
          className="text-xs font-medium text-brand-500 transition-colors hover:text-brand-600"
        >
          View all →
        </Link>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="No open tasks"
          description="Pending tasks will show up here."
          icon={CheckSquare}
          className="min-h-[200px] py-8"
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {tasks.map((task) => {
            const overdue = isOverdue(task);
            return (
              <li key={task.id}>
                <div
                  className="flex items-center gap-3 py-2"
                  style={{ minHeight: 48 }}
                >
                  <TypeIcon type={task.type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-slate-900">{task.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {formatDate(task.due_date)}
                      {overdue ? (
                        <span className="ml-1.5 text-[10px] font-semibold text-red-500">
                          Overdue
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusChip status={task.status} kind="task" />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
