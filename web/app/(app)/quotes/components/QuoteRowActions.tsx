"use client";

import {
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  acceptQuoteAction,
  deleteQuoteAction,
  updateQuoteStatusAction,
} from "../actions";
import { QuoteForm } from "./QuoteForm";
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
import { toastMutationError } from "@/components/zims/app-toast";
import { ConfirmDialog } from "@/components/zims/confirm-dialog";

const INDIGO_SOLID =
  "border-transparent bg-indigo-600 text-white shadow-none hover:bg-indigo-700 focus-visible:border-indigo-600 focus-visible:ring-indigo-500/40 dark:bg-indigo-600 dark:hover:bg-indigo-500";
import type { Quote, QuotePartyOption, QuoteStatus } from "@/lib/schemas";

const QUOTES_QUERY_KEY = ["quotes"] as const;

function partyLabelForQuote(
  quote: Quote,
  leadById: Map<string, string>,
  customerById: Map<string, string>,
): string {
  if (quote.lead_id) {
    return leadById.get(quote.lead_id) ?? `Lead #${quote.lead_id}`;
  }
  if (quote.customer_id) {
    return customerById.get(quote.customer_id) ?? `Customer #${quote.customer_id}`;
  }
  return "—";
}

export function QuoteRowActions({
  quote,
  leads,
  customers,
}: {
  quote: Quote;
  leads: QuotePartyOption[];
  customers: QuotePartyOption[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const leadById = new Map(leads.map((l) => [l.id, l.name]));
  const customerById = new Map(customers.map((c) => [c.id, c.name]));
  const partyLabel = partyLabelForQuote(quote, leadById, customerById);

  const [editOpen, setEditOpen] = useState(false);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuoteStatus }) =>
      updateQuoteStatusAction(id, status),
    onSuccess: (res, vars) => {
      if (!res.ok) {
        toastMutationError(res.error);
        return;
      }
      if (vars.status === "sent") {
        toast.success("Quote updated");
      } else if (vars.status === "rejected") {
        toast.success("Quote rejected");
      } else {
        toast.success("Quote updated");
      }
      void queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
      router.refresh();
    },
    onError: (err: Error) => {
      toastMutationError(err.message);
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => acceptQuoteAction(id),
    onSuccess: (res) => {
      if (!res.ok) {
        toastMutationError(res.error);
        return;
      }
      toast.success(
        "Quote accepted — policy created automatically",
      );
      void queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
      setAcceptOpen(false);
      router.refresh();
    },
    onError: (err: Error) => {
      toastMutationError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuoteAction(id),
    onSuccess: (res) => {
      if (!res.ok) {
        toastMutationError(res.error);
        return;
      }
      toast.success("Quote deleted");
      void queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
      setDeleteOpen(false);
      router.refresh();
    },
    onError: (err: Error) => {
      toastMutationError(err.message);
    },
  });

  const rowBusy =
    statusMutation.isPending ||
    acceptMutation.isPending ||
    deleteMutation.isPending;

  const canEdit = quote.status === "draft" || quote.status === "sent";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={rowBusy}
              aria-label="Row actions"
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {quote.status === "draft" ? (
            <DropdownMenuItem
              className="gap-2"
              onClick={() => {
                statusMutation.mutate({ id: quote.id, status: "sent" });
              }}
            >
              <Send className="h-4 w-4" />
              Mark as sent
            </DropdownMenuItem>
          ) : null}
          {quote.status === "sent" ? (
            <DropdownMenuItem
              className="gap-2"
              onClick={() => setAcceptOpen(true)}
            >
              <CheckCircle2 className="h-4 w-4" />
              Accept quote
            </DropdownMenuItem>
          ) : null}
          {quote.status === "sent" ? (
            <DropdownMenuItem
              className="gap-2"
              onClick={() => {
                statusMutation.mutate({ id: quote.id, status: "rejected" });
              }}
            >
              <XCircle className="h-4 w-4" />
              Mark as rejected
            </DropdownMenuItem>
          ) : null}
          {canEdit ? (
            <DropdownMenuItem
              className="gap-2"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit quote</DialogTitle>
            <DialogDescription>
              Update policy details, premium, and validity. Linked lead or customer
              cannot be changed here.
            </DialogDescription>
          </DialogHeader>
          <QuoteForm
            mode="edit"
            quote={quote}
            leads={leads}
            customers={customers}
            partyLabel={partyLabel}
            onSuccess={() => setEditOpen(false)}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={acceptOpen}
        onOpenChange={setAcceptOpen}
        title="Accept this quote?"
        description="A new policy will be created automatically. This cannot be undone."
        confirmLabel="Accept"
        confirmVariant="default"
        confirmClassName={INDIGO_SOLID}
        pending={acceptMutation.isPending}
        onConfirm={async () => {
          acceptMutation.mutate(quote.id);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this quote?"
        description="This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        pending={deleteMutation.isPending}
        onConfirm={async () => {
          deleteMutation.mutate(quote.id);
        }}
      />
    </>
  );
}
