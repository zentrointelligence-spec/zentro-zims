"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Megaphone, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createBroadcastAction,
  previewBroadcastRecipientsAction,
} from "../actions";
import { Button } from "@/components/ui/button";
import { toastMutationError } from "@/components/zims/app-toast";
import { InlineSpinner } from "@/components/zims/loading-spinner";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CreateBroadcastSchema, type BroadcastSegment } from "@/lib/schemas";
import type { z } from "zod";

const SEGMENT_OPTIONS: { value: BroadcastSegment; label: string }[] = [
  { value: "all", label: "All customers" },
  { value: "renewal_due", label: "Renewal due" },
  { value: "expired", label: "Expired policies" },
  { value: "birthday_this_month", label: "Birthdays this month" },
  { value: "by_policy_type", label: "By policy type" },
];

const fieldShell =
  "flex w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30";

type FormValues = z.input<typeof CreateBroadcastSchema>;
type FormOutput = z.infer<typeof CreateBroadcastSchema>;

const QUERY_KEY = ["broadcasts"] as const;

function normalizePayload(values: FormValues): FormOutput {
  const base: z.input<typeof CreateBroadcastSchema> = {
    name: values.name.trim(),
    target_segment: values.target_segment,
    message_template: values.message_template.trim(),
    policy_type_filter:
      values.target_segment === "by_policy_type"
        ? (values.policy_type_filter ?? "").trim() || null
        : null,
    scheduled_at:
      values.scheduled_at && String(values.scheduled_at).trim()
        ? String(values.scheduled_at).trim()
        : null,
  };
  return CreateBroadcastSchema.parse(base);
}

export function BroadcastForm({
  autoOpenCreate,
}: {
  autoOpenCreate?: boolean;
}) {
  const [open, setOpen] = useState(() => Boolean(autoOpenCreate));
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewNames, setPreviewNames] = useState<string[]>([]);
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(CreateBroadcastSchema),
    defaultValues: {
      name: "",
      target_segment: "all",
      message_template: "",
      policy_type_filter: undefined,
      scheduled_at: undefined,
    },
  });

  const segment = useWatch({
    control: form.control,
    name: "target_segment",
    defaultValue: "all",
  });

  useKeyboardShortcut("n", () => setOpen(true), !open);

  const createMutation = useMutation({
    mutationFn: (payload: FormOutput) => createBroadcastAction(payload),
    onSuccess: (res) => {
      if (!res.ok) {
        toastMutationError(res.error);
        return;
      }
      toast.success("Broadcast created");
      form.reset({
        name: "",
        target_segment: "all",
        message_template: "",
        policy_type_filter: undefined,
        scheduled_at: undefined,
      });
      setPreviewCount(null);
      setPreviewNames([]);
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      if (autoOpenCreate) {
        router.replace("/broadcasts", { scroll: false });
      } else {
        router.refresh();
      }
    },
    onError: (err: Error) => {
      toastMutationError(err.message);
    },
  });

  const previewMutation = useMutation({
    mutationFn: (payload: FormOutput) =>
      previewBroadcastRecipientsAction(payload),
    onSuccess: (res) => {
      if (!res.ok) {
        toastMutationError(res.error);
        return;
      }
      setPreviewCount(res.data.count);
      setPreviewNames(res.data.customers.slice(0, 5).map((c) => c.name));
    },
    onError: (err: Error) => {
      toastMutationError(err.message);
    },
  });

  const busy = createMutation.isPending;
  const previewBusy = previewMutation.isPending;

  function onSubmit(values: FormOutput) {
    createMutation.mutate(values);
  }

  function onPreview() {
    const parsed = CreateBroadcastSchema.safeParse(normalizePayload(form.getValues()));
    if (!parsed.success) {
      toastMutationError(parsed.error.issues.map((i) => i.message).join("; "));
      return;
    }
    previewMutation.mutate(parsed.data);
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setPreviewCount(null);
      setPreviewNames([]);
      if (autoOpenCreate) {
        router.replace("/broadcasts", { scroll: false });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={<Button type="button" variant="default" disabled={busy} />}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        New broadcast
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            New broadcast
          </DialogTitle>
          <DialogDescription>
            Target a customer segment and compose a WhatsApp message. Use{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{name}"}</code>{" "}
            as a placeholder for the customer&apos;s name.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => onSubmit(normalizePayload(v)))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. March renewal reminder" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_segment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target segment</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className={cn(fieldShell, "h-9 py-1")}
                      aria-label="Target segment"
                    >
                      {SEGMENT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {segment === "by_policy_type" ? (
              <FormField
                control={form.control}
                name="policy_type_filter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy type</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. motor"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="message_template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={4}
                      className={cn(fieldShell, "min-h-[100px] resize-y")}
                      placeholder="Hi {name}, …"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Use {"{name}"} as a placeholder for the customer&apos;s name.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduled_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">
                Preview recipients
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                We&apos;ll simulate a draft on the server to count matching
                customers (nothing is sent until you click Send on a saved
                draft).
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3"
                disabled={previewBusy || busy}
                onClick={onPreview}
              >
                {previewBusy ? (
                  <>
                    <InlineSpinner className="mr-2" />
                    Preview recipients
                  </>
                ) : (
                  "Preview recipients"
                )}
              </Button>
              {previewCount !== null ? (
                <div className="mt-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {previewCount.toLocaleString()} customers will receive this
                    message
                  </p>
                  {previewNames.length > 0 ? (
                    <p className="mt-1 text-xs">
                      Sample: {previewNames.join(", ")}
                      {previewCount > previewNames.length ? "…" : null}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <InlineSpinner className="mr-2" />
                    Create broadcast
                  </>
                ) : (
                  "Create broadcast"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
