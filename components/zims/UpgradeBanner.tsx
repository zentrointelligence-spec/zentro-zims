"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Inline banner when plan limits block an action (403 from API).
 * Link to /billing for admins to upgrade; safe to render for any role.
 */
export function UpgradeBanner({
  message,
  onUpgrade,
}: {
  message: string;
  onUpgrade?: () => void;
}) {
  return (
    <div
      className="flex flex-row flex-wrap items-center gap-3 rounded-md border px-4 py-3 text-sm"
      style={{
        backgroundColor: "#fef3c7",
        borderColor: "#fbbf24",
        padding: "12px 16px",
      }}
    >
      <Lock
        className="h-4 w-4 shrink-0 text-amber-900"
        aria-hidden
      />
      <p className="min-w-0 flex-1 text-center text-amber-950">{message}</p>
      <div className="flex shrink-0 justify-end">
        {onUpgrade ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-amber-600 bg-white/80 text-amber-950 hover:bg-amber-50 dark:bg-background/80"
            onClick={onUpgrade}
          >
            Upgrade plan
          </Button>
        ) : (
          <Link
            href="/billing"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-amber-600 bg-white/80 text-amber-950 hover:bg-amber-50 dark:bg-background/80",
            )}
          >
            Upgrade plan
          </Link>
        )}
      </div>
    </div>
  );
}
