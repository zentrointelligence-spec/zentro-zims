"use client";

import { MoreHorizontal, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteBroadcastAction, sendBroadcastAction } from "../actions";
import { Button } from "@/components/ui/button";
import { toastMutationError } from "@/components/zims/app-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/zims/confirm-dialog";
import type { Broadcast } from "@/lib/schemas";

const QUERY_KEY = ["broadcasts"] as const;

const INDIGO_SOLID =
  "border-transparent bg-indigo-600 text-white shadow-none hover:bg-indigo-700 focus-visible:border-indigo-600 focus-visible:ring-indigo-500/40 dark:bg-indigo-600 dark:hover:bg-indigo-500";

export function BroadcastRowActions({ broadcast }: { broadcast: Broadcast }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sendOpen, setSendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const sendMutation = useMutation({
    mutationFn: () => sendBroadcastAction(broadcast.id),
    onSuccess: (res) => {
      if (!res.ok) {
        toastMutationError(res.error);
        return;
      }
      toast.success("Broadcast is sending");
      setSendOpen(false);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      router.refresh();
    },
    onError: (err: Error) => {
      toastMutationError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBroadcastAction(broadcast.id),
    onSuccess: (res) => {
      if (!res.ok) {
        toastMutationError(res.error);
        return;
      }
      toast.success("Broadcast deleted");
      setDeleteOpen(false);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      router.refresh();
    },
    onError: (err: Error) => {
      toastMutationError(err.message);
    },
  });

  const isDraft = broadcast.status === "draft";
  const busy = sendMutation.isPending || deleteMutation.isPending;

  if (!isDraft) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

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
              aria-label="Row actions"
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            className="gap-2"
            onClick={() => setSendOpen(true)}
          >
            <Send className="h-4 w-4" />
            Send
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="gap-2"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        title="Send this broadcast?"
        description={
          <>
            This will send a WhatsApp message to all matched customers. This
            cannot be undone.
          </>
        }
        confirmLabel="Send"
        confirmVariant="default"
        confirmClassName={INDIGO_SOLID}
        pending={sendMutation.isPending}
        onConfirm={() => {
          sendMutation.mutate();
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this broadcast?"
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
