"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { runRenewalsAction } from "../actions";
import { Button } from "@/components/ui/button";
import { toastMutationError } from "@/components/zims/app-toast";

export function RunRenewalsButton() {
  const [pending, start] = useTransition();
  const router = useRouter();

  function onClick() {
    start(async () => {
      const res = await runRenewalsAction();
      if (res.ok) {
        toast.success("Renewal check complete");
        router.refresh();
      } else {
        toastMutationError(res.error);
      }
    });
  }

  return (
    <Button variant="outline" onClick={onClick} disabled={pending}>
      <RefreshCw
        className={`mr-1.5 h-4 w-4 ${pending ? "animate-spin" : ""}`}
      />
      Run renewals
    </Button>
  );
}
