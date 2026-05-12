"use client";

import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { convertLeadAction, deleteLeadAction } from "../actions";
import { Button } from "@/components/ui/button";
import { toastMutationError } from "@/components/zims/app-toast";
import { InlineSpinner } from "@/components/zims/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Lead } from "@/lib/schemas";

const QUERY_KEY = ["leads"] as const;

export function LeadRowActions({ lead }: { lead: Lead }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const convertMutation = useMutation({
    mutationFn: () => convertLeadAction(lead.id),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Lead converted to customer");
        void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        router.refresh();
      } else {
        toastMutationError(res.error);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLeadAction(lead.id),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Lead deleted");
        setConfirmOpen(false);
        void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        router.refresh();
      } else {
        toastMutationError(res.error);
      }
    },
  });

  const busy = convertMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-green-700 hover:bg-green-50 hover:text-green-700"
          disabled={busy || lead.status === "converted"}
          onClick={() => convertMutation.mutate()}
          title={
            lead.status === "converted"
              ? "Already converted"
              : "Create customer from this lead"
          }
        >
          {convertMutation.isPending ? (
            <InlineSpinner className="size-3.5" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          <span className="ml-1 hidden sm:inline">Convert →</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-destructive hover:text-destructive"
          disabled={busy}
          onClick={() => setConfirmOpen(true)}
        >
          Delete
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this lead?</DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">{lead.name}</span>{" "}
              from your pipeline. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              className="h-9 min-h-9"
              onClick={() => setConfirmOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-9 min-h-9"
              disabled={busy}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? (
                <>
                  <InlineSpinner className="mr-2" />
                  Delete
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
