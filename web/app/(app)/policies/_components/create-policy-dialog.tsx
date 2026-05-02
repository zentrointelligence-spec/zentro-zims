"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createPolicyAction } from "../actions";
import { Button } from "@/components/ui/button";
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
import { toastMutationError } from "@/components/zims/app-toast";
import { InlineSpinner } from "@/components/zims/loading-spinner";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import type { Customer } from "@/lib/schemas";

// `z.coerce.number()` has an `unknown` input type and a `number` output type,
// so we need to tell useForm both halves explicitly (TFieldValues = input,
// TTransformedValues = output).
const FormSchema = z
  .object({
    customer_id: z.coerce
      .number({ message: "Select a customer" })
      .int()
      .positive("Select a customer"),
    policy_type: z.string().min(1, "Policy type is required"),
    policy_number: z.string().min(1, "Policy number is required"),
    start_date: z.string().min(1, "Start date is required"),
    expiry_date: z.string().min(1, "Expiry date is required"),
    premium: z.coerce
      .number({ message: "Premium must be a number" })
      .nonnegative("Premium cannot be negative"),
  })
  .refine((v) => v.expiry_date >= v.start_date, {
    message: "Expiry must be on or after start date",
    path: ["expiry_date"],
  });

type FormInput = z.input<typeof FormSchema>;
type FormOutput = z.output<typeof FormSchema>;

export function CreatePolicyDialog({
  customers,
  autoOpenCreate,
}: {
  customers: Customer[];
  autoOpenCreate?: boolean;
}) {
  const [open, setOpen] = useState(() => Boolean(autoOpenCreate));
  const [pending, start] = useTransition();
  const router = useRouter();
  const disabled = customers.length === 0;

  useKeyboardShortcut("n", () => setOpen(true), !open && !disabled);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      customer_id: "",
      policy_type: "motor",
      policy_number: "",
      start_date: today(),
      expiry_date: oneYearFromToday(),
      premium: "",
    },
  });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next && autoOpenCreate) {
      router.replace("/policies", { scroll: false });
    }
  }

  function onSubmit(values: FormOutput) {
    start(async () => {
      const res = await createPolicyAction(values);
      if (res.ok) {
        toast.success("Policy created");
        form.reset({
          customer_id: "",
          policy_type: "motor",
          policy_number: "",
          start_date: today(),
          expiry_date: oneYearFromToday(),
          premium: "",
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toastMutationError(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button
            disabled={disabled}
            title={disabled ? "Add a customer first" : ""}
          />
        }
      >
        <Plus className="mr-1.5 h-4 w-4" />
        New policy
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a policy</DialogTitle>
          <DialogDescription>
            Attach a policy to an existing customer. Use Excel import for bulk
            uploads.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-4"
          >
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Customer</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      value={String(field.value ?? "")}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    >
                      <option value="" disabled>
                        Select customer…
                      </option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} · {c.phone}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="policy_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Input placeholder="motor / life / medical" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="policy_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy number</FormLabel>
                  <FormControl>
                    <Input placeholder="POL-1001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiry_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="premium"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Premium</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="1200.00"
                      {...field}
                      value={(field.value as string | number | undefined) ?? ""}
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
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <>
                    <InlineSpinner className="mr-2" />
                    Create policy
                  </>
                ) : (
                  "Create policy"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
function oneYearFromToday() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}
