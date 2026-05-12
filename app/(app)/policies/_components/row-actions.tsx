"use client";

import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deletePolicyAction, updatePolicyStatusAction } from "../actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toastMutationError } from "@/components/zims/app-toast";
import { ConfirmDialog } from "@/components/zims/confirm-dialog";
import type { Policy, PolicyStatus } from "@/lib/schemas";

const STATUS_CHOICES: PolicyStatus[] = [
  "active",
  "renewal_due",
  "expired",
  "cancelled",
];

export function PolicyRowActions({ policy }: { policy: Policy }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function setStatus(next: PolicyStatus) {
    if (next === policy.status) return;
    start(async () => {
      const res = await updatePolicyStatusAction(policy.id, next);
      if (res.ok) {
        toast.success("Policy updated");
        router.refresh();
      } else {
        toastMutationError(res.error);
      }
    });
  }

  function confirmDelete() {
    start(async () => {
      const res = await deletePolicyAction(policy.id);
      if (res.ok) {
        toast.success("Policy deleted");
        setDeleteOpen(false);
        router.refresh();
      } else {
        toastMutationError(res.error);
      }
    });
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
              disabled={pending}
              aria-label="Row actions"
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Change status</DropdownMenuLabel>
          {STATUS_CHOICES.map((s) => (
            <DropdownMenuItem
              key={s}
              disabled={s === policy.status}
              onClick={() => setStatus(s)}
              className="capitalize"
            >
              {s.replace("_", " ")}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive"
          >
            Delete policy
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this policy?"
        description={
          <>
            Permanently remove policy{" "}
            <span className="font-medium text-foreground">
              {policy.policy_number}
            </span>
            ? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        confirmVariant="destructive"
        pending={pending}
        onConfirm={() => {
          confirmDelete();
        }}
      />
    </>
  );
}
