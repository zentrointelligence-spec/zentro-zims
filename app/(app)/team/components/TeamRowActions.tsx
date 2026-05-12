"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { removeUserAction } from "../actions";
import { Button } from "@/components/ui/button";
import { toastMutationError } from "@/components/zims/app-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/zims/confirm-dialog";
import type { User } from "@/lib/schemas";

const TEAM_QUERY_KEY = ["team", "users"] as const;

export function TeamRowActions({
  user,
  currentUserId,
}: {
  user: User;
  currentUserId: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isSelf = user.id === currentUserId;

  const removeMutation = useMutation({
    mutationFn: () => removeUserAction(user.id),
    onSuccess: (res) => {
      if (!res.ok) {
        toastMutationError(res.error);
        return;
      }
      toast.success("User removed");
      void queryClient.invalidateQueries({ queryKey: TEAM_QUERY_KEY });
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
        <span title={isSelf ? "You cannot remove yourself" : undefined} className="inline-flex">
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={removeMutation.isPending}
                aria-label="Row actions"
              />
            }
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
        </span>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            variant="destructive"
            disabled={isSelf}
            title={isSelf ? "You cannot remove yourself" : undefined}
            onClick={() => {
              if (isSelf) return;
              setConfirmOpen(true);
            }}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Remove user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remove this user?"
        description={`${user.name} will lose access immediately. This cannot be undone.`}
        confirmLabel="Remove"
        confirmVariant="destructive"
        pending={removeMutation.isPending}
        onConfirm={() => {
          removeMutation.mutate();
        }}
      />
    </>
  );
}
