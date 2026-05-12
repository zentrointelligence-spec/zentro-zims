"use client";

import { MoreHorizontal, Pencil, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteCustomerAction } from "../actions";
import { toastMutationError } from "@/components/zims/app-toast";
import { CustomerForm } from "./CustomerForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/zims/confirm-dialog";
import type { Customer } from "@/lib/schemas";

const CUSTOMERS_QUERY_KEY = ["customers"] as const;

export function CustomerRowActions({ customer }: { customer: Customer }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteCustomerAction(customer.id),
    onSuccess: (res) => {
      if (!res.ok) {
        toastMutationError(res.error);
        return;
      }
      toast.success("Customer deleted");
      void queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      setConfirmOpen(false);
      router.refresh();
    },
    onError: (err: Error) => {
      toastMutationError(err.message);
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={deleteMutation.isPending}
              aria-label="Row actions"
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => {
              router.push(`/customers/${customer.id}`);
            }}
            className="gap-2"
          >
            <User className="h-4 w-4" />
            View profile
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setEditOpen(true);
            }}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
            <DialogDescription>Update contact details for {customer.name}.</DialogDescription>
          </DialogHeader>
          <CustomerForm
            mode="edit"
            customer={customer}
            onSuccess={() => setEditOpen(false)}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this customer?"
        description="This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate();
        }}
      />
    </>
  );
}
