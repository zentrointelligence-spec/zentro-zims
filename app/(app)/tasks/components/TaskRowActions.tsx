"use client";

import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  deleteTaskAction,
  updateTaskStatusAction,
} from "../actions";
import { Button } from "@/components/ui/button";
import { toastMutationError } from "@/components/zims/app-toast";
import { ConfirmDialog } from "@/components/zims/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task, TaskStatus } from "@/lib/schemas";

const QUERY_KEY = ["tasks"] as const;

export function TaskRowActions({
  task,
  displayStatus,
  onOptimisticStatus,
  onClearOptimistic,
  onEdit,
}: {
  task: Task;
  displayStatus: TaskStatus;
  onOptimisticStatus: (id: number, status: TaskStatus) => void;
  onClearOptimistic: (id: number) => void;
  onEdit: (task: Task) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const s = displayStatus;

  const statusMutation = useMutation({
    mutationFn: (next: TaskStatus) => updateTaskStatusAction(task.id, next),
    onMutate: (next) => {
      onOptimisticStatus(task.id, next);
    },
    onSuccess: (res) => {
      if (!res.ok) {
        toastMutationError(res.error);
        onClearOptimistic(task.id);
        return;
      }
      toast.success("Task updated");
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      router.refresh();
    },
    onError: () => {
      onClearOptimistic(task.id);
      toast.error("Could not update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTaskAction(task.id),
    onSuccess: (res) => {
      if (!res.ok) {
        toastMutationError(res.error);
        return;
      }
      toast.success("Task deleted");
      setDeleteOpen(false);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      router.refresh();
    },
    onError: (err: Error) => {
      toastMutationError(err.message);
    },
  });

  const busy = statusMutation.isPending || deleteMutation.isPending;

  const showMarkInProgress = s === "pending";
  const showMarkDone = s === "pending" || s === "in_progress";
  const showMarkCancelled = s !== "done" && s !== "cancelled";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={busy}
              aria-label="Task actions"
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {showMarkInProgress ? (
            <DropdownMenuItem
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate("in_progress")}
            >
              Mark as in progress
            </DropdownMenuItem>
          ) : null}
          {showMarkDone ? (
            <DropdownMenuItem
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate("done")}
            >
              Mark as done
            </DropdownMenuItem>
          ) : null}
          {showMarkCancelled ? (
            <DropdownMenuItem
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate("cancelled")}
            >
              Mark as cancelled
            </DropdownMenuItem>
          ) : null}
          {(showMarkInProgress || showMarkDone || showMarkCancelled) ? (
            <DropdownMenuSeparator />
          ) : null}
          <DropdownMenuItem
            onClick={() => {
              onEdit(task);
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this task?"
        description="This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate();
        }}
      />
    </>
  );
}
