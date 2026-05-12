"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Check } from "lucide-react";

import { updateTaskStatusAction } from "@/app/(app)/tasks/actions";
import type { Task } from "@/lib/schemas";
import { cn } from "@/lib/utils";

function isLocalToday(iso: string, ref: Date = new Date()): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

function taskTypeLabel(type: Task["type"]): string {
  const m: Record<Task["type"], string> = {
    followup: "Follow-up",
    renewal: "Renewal",
    call: "Call",
    other: "Other",
  };
  return m[type];
}

export function TodayTasks({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set());
  const [fadingIds, setFadingIds] = useState<Set<number>>(new Set());
  const [busyId, setBusyId] = useState<number | null>(null);

  const todayTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          isLocalToday(t.due_date) &&
          (t.status === "pending" || t.status === "in_progress"),
      ),
    [tasks],
  );

  const markDone = useCallback(
    (id: number) => {
      if (busyId !== null || doneIds.has(id)) return;
      setBusyId(id);
      startTransition(async () => {
        const res = await updateTaskStatusAction(id, "done");
        setBusyId(null);
        if (!res.ok) return;
        setDoneIds((prev) => new Set(prev).add(id));
        window.setTimeout(() => {
          setFadingIds((prev) => new Set(prev).add(id));
          window.setTimeout(() => {
            router.refresh();
          }, 550);
        }, 500);
      });
    },
    [busyId, doneIds, router],
  );

  if (todayTasks.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#e2e8f0] border-l-4 border-l-brand-500 bg-white p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Today&apos;s tasks</h2>
        <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
          {todayTasks.length} pending today
        </span>
      </div>

      <ul className="divide-y divide-slate-100">
        {todayTasks.map((task) => {
          const completed = doneIds.has(task.id);
          const fading = fadingIds.has(task.id);
          return (
            <li
              key={task.id}
              className={cn(
                "flex items-center gap-3 py-2.5 transition-opacity duration-500",
                fading && "opacity-0",
              )}
            >
              <button
                type="button"
                disabled={isPending || completed || busyId === task.id}
                onClick={() => markDone(task.id)}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  completed
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-slate-200 bg-white hover:border-brand-300",
                )}
                aria-label={completed ? "Completed" : "Mark done"}
              >
                {completed ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-slate-800">{task.title}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-600">
                {taskTypeLabel(task.type)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
