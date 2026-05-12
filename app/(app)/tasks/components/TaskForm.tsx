"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createTaskAction,
  updateTaskAction,
} from "../actions";
import { Button } from "@/components/ui/button";
import { toastMutationError } from "@/components/zims/app-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/zims/loading-spinner";
import type { Task, TaskType } from "@/lib/schemas";

const QUERY_KEY = ["tasks"] as const;

const TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: "followup", label: "Follow-up" },
  { value: "renewal", label: "Renewal" },
  { value: "call", label: "Call" },
  { value: "other", label: "Other" },
];

export type TaskFormValues = {
  title: string;
  type: TaskType;
  due_date: string;
  description: string;
};

function toDateInputValue(due: string): string {
  if (!due) return "";
  return due.slice(0, 10);
}

export function TaskForm({
  mode,
  task,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  task?: Task;
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<TaskFormValues>({
    defaultValues: {
      title: task?.title ?? "",
      type: task?.type ?? "followup",
      due_date: task ? toDateInputValue(task.due_date) : "",
      description: task?.description ?? "",
    },
  });

  useEffect(() => {
    if (task && mode === "edit") {
      form.reset({
        title: task.title,
        type: task.type,
        due_date: toDateInputValue(task.due_date),
        description: task.description ?? "",
      });
    }
  }, [task, mode, form]);

  const mutation = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      const fd = new FormData();
      fd.set("title", values.title.trim());
      fd.set("type", values.type);
      fd.set("due_date", values.due_date);
      fd.set("description", values.description.trim());
      if (mode === "create") {
        return createTaskAction(fd);
      }
      if (!task) {
        return { ok: false as const, error: "Missing task" };
      }
      return updateTaskAction(task.id, fd);
    },
    onSuccess: (res) => {
      if (!res.ok) {
        toastMutationError(res.error);
        return;
      }
      toast.success(mode === "create" ? "Task created" : "Task updated");
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      router.refresh();
      onSuccess();
    },
    onError: (err: Error) => {
      toastMutationError(err.message);
    },
  });

  function onSubmit(values: TaskFormValues) {
    let ok = true;
    if (!values.title.trim()) {
      form.setError("title", { message: "Title is required" });
      ok = false;
    } else {
      form.clearErrors("title");
    }
    if (!values.due_date) {
      form.setError("due_date", { message: "Due date is required" });
      ok = false;
    } else {
      form.clearErrors("due_date");
    }
    if (!ok) return;
    mutation.mutate(values);
  }

  const busy = mutation.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Call client about renewal"
                      disabled={busy}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange((v ?? "followup") as TaskType)}
                    disabled={busy}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full" disabled={busy}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due date</FormLabel>
                  <FormControl>
                    <Input type="date" disabled={busy} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={3}
                      disabled={busy}
                      placeholder="Notes for your team…"
                      className="flex min-h-[80px] w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          {onCancel ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => onCancel()}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={busy}>
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner
                  className="!min-h-0 min-h-0 justify-start py-0 [&_svg]:h-4 [&_svg]:w-4"
                  label=""
                />
                {mode === "create" ? "Creating…" : "Saving…"}
              </span>
            ) : mode === "create" ? (
              "Create task"
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
