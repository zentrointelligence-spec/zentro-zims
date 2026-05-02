"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createCustomerAction, updateCustomerAction } from "../actions";
import { toastMutationError } from "@/components/zims/app-toast";
import { InlineSpinner } from "@/components/zims/loading-spinner";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
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
import {
  CreateCustomerSchema,
  UpdateCustomerFormSchema,
  type Customer,
} from "@/lib/schemas";
import type { z } from "zod";

const CUSTOMERS_QUERY_KEY = ["customers"] as const;

type CreateFormValues = z.infer<typeof CreateCustomerSchema>;
type UpdateFormValues = z.infer<typeof UpdateCustomerFormSchema>;

function displayPhone(phone: string) {
  return phone === "00000" ? "" : phone;
}

export function CustomerCreateLauncher({
  autoOpenCreate,
}: {
  autoOpenCreate?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(() => Boolean(autoOpenCreate));

  useKeyboardShortcut("n", () => setOpen(true), !open);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next && autoOpenCreate) {
      router.replace("/customers", { scroll: false });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button type="button" variant="default" />}>
        <Plus className="mr-1.5 h-4 w-4" />
        New customer
      </DialogTrigger>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
          <DialogDescription>
            Add a customer to your book. Phone can be left blank — a placeholder
            record is stored to satisfy carrier minimums.
          </DialogDescription>
        </DialogHeader>
        <CustomerForm
          mode="create"
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function CustomerForm({
  mode,
  customer,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  customer?: Customer;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(CreateCustomerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const editForm = useForm<UpdateFormValues>({
    resolver: zodResolver(UpdateCustomerFormSchema),
    defaultValues: {
      name: customer?.name ?? "",
      phone: displayPhone(customer?.phone ?? ""),
      email: customer?.email ?? "",
      address: customer?.address ?? "",
    },
  });

  useEffect(() => {
    if (mode === "edit" && customer) {
      editForm.reset({
        name: customer.name,
        phone: displayPhone(customer.phone),
        email: customer.email ?? "",
        address: customer.address ?? "",
      });
    }
  }, [mode, customer, editForm]);

  const createMutation = useMutation({
    mutationFn: async (fd: FormData) => createCustomerAction(fd),
    onSuccess: (res) => {
      if (!res.ok) {
        toastMutationError(res.error);
        return;
      }
      toast.success("Customer created");
      void queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      router.refresh();
      createForm.reset({ name: "", phone: "", email: "", address: "" });
      onSuccess();
    },
    onError: (err: Error) => {
      toastMutationError(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (fd: FormData) => {
      if (!customer) throw new Error("Missing customer");
      return updateCustomerAction(customer.id, fd);
    },
    onSuccess: (res) => {
      if (!res.ok) {
        toastMutationError(res.error);
        return;
      }
      toast.success("Customer updated");
      void queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      if (customer) {
        void queryClient.invalidateQueries({
          queryKey: ["customer", customer.id],
        });
      }
      router.refresh();
      onSuccess();
    },
    onError: (err: Error) => {
      toastMutationError(err.message);
    },
  });

  if (mode === "create") {
    const busy = createMutation.isPending;
    return (
      <Form {...createForm}>
        <form
          onSubmit={createForm.handleSubmit(() => {
            const raw = createForm.getValues();
            const fd = new FormData();
            fd.set("name", raw.name);
            fd.set("phone", raw.phone ?? "");
            if (raw.email) fd.set("email", raw.email);
            if (raw.address) fd.set("address", raw.address);
            createMutation.mutate(fd);
          })}
          className="grid gap-4"
        >
          <FormField
            control={createForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="name" disabled={busy} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={createForm.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" autoComplete="tel" disabled={busy} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={createForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" autoComplete="email" disabled={busy} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={createForm.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="street-address" disabled={busy} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter className="gap-2 border-t-0 bg-transparent p-0 pt-2 sm:justify-end">
            <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <>
                  <InlineSpinner className="mr-2" />
                  Create customer
                </>
              ) : (
                "Create customer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  }

  const busy = updateMutation.isPending;
  return (
    <Form {...editForm}>
      <form
        onSubmit={editForm.handleSubmit(() => {
          const raw = editForm.getValues();
          const fd = new FormData();
          fd.set("name", raw.name);
          fd.set("phone", raw.phone);
          fd.set("email", raw.email);
          fd.set("address", raw.address);
          updateMutation.mutate(fd);
        })}
        className="grid gap-4"
      >
        <FormField
          control={editForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="name" disabled={busy} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input {...field} type="tel" autoComplete="tel" disabled={busy} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" autoComplete="email" disabled={busy} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={editForm.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="street-address" disabled={busy} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="gap-2 border-t-0 bg-transparent p-0 pt-2 sm:justify-end">
          <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? (
              <>
                <InlineSpinner className="mr-2" />
                Save changes
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
