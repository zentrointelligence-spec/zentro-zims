"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createLeadAction } from "../actions";
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
import { LeadCreatePayload } from "@/lib/schemas";
import { z } from "zod";

type FormInput = z.input<typeof LeadCreatePayload>;
type FormOutput = z.output<typeof LeadCreatePayload>;

const QUERY_KEY = ["leads"] as const;

export function LeadForm({ autoOpenCreate }: { autoOpenCreate?: boolean }) {
  const [open, setOpen] = useState(() => Boolean(autoOpenCreate));
  const router = useRouter();
  const queryClient = useQueryClient();

  useKeyboardShortcut("n", () => setOpen(true), !open);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(LeadCreatePayload),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      insurance_type: "",
      source: "",
      notes: "",
      status: "new",
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: FormOutput) => createLeadAction(payload),
    onSuccess: (res) => {
      if (!res.ok) {
        toastMutationError(res.error);
        return;
      }
      toast.success("Lead created");
      form.reset({
        name: "",
        phone: "",
        email: "",
        insurance_type: "",
        source: "",
        notes: "",
        status: "new",
      });
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      if (autoOpenCreate) {
        router.replace("/leads", { scroll: false });
      } else {
        router.refresh();
      }
    },
    onError: (err: Error) => {
      toastMutationError(err.message);
    },
  });

  function onSubmit(values: FormOutput) {
    mutation.mutate(values);
  }

  const busy = mutation.isPending;

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next && autoOpenCreate) {
      router.replace("/leads", { scroll: false });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={<Button type="button" variant="default" disabled={busy} />}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        New lead
      </DialogTrigger>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a lead</DialogTitle>
          <DialogDescription>
            Add a prospect to your pipeline. You can update status and convert
            to a customer later.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 555 0100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="jane@example.com"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="insurance_type"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Insurance type</FormLabel>
                  <FormControl>
                    <Input placeholder="motor, life, health…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="referral, web, walk-in…"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional context"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="col-span-2 mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <InlineSpinner className="mr-2" />
                    Create lead
                  </>
                ) : (
                  "Create lead"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
