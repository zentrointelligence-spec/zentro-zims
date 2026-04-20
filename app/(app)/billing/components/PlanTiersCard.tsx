"use client";

import { useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlanTier } from "@/lib/schemas";

import { startCheckoutAction } from "../actions";
import { toastMutationError } from "@/components/zims/app-toast";

export function PlanTiersCard({
  currentPlan,
  growthPriceId,
  proPriceId,
}: {
  currentPlan: PlanTier;
  growthPriceId: string;
  proPriceId: string;
}) {
  const [pending, startTransition] = useTransition();

  async function upgrade(priceId: string) {
    try {
      const res = await startCheckoutAction(priceId);
      if (res && "error" in res) {
        toastMutationError(res.error);
      }
    } catch (err) {
      if (isRedirectError(err)) return;
      toastMutationError(
        err instanceof Error ? err.message : "Checkout failed",
      );
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Available plans</h2>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Starter */}
        <div className="flex flex-col rounded-lg border border-border bg-background p-4">
          <h3 className="text-base font-semibold">Starter</h3>
          <p className="mt-1 text-sm text-muted-foreground">Free</p>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
            <li>• 3 users</li>
            <li>• 100 leads, 50 policies</li>
            <li>• Lead and policy management</li>
            <li>• WhatsApp logging</li>
            <li>• Excel import</li>
          </ul>
          <div className="mt-4">
            {currentPlan === "starter" ? (
              <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                Current plan
              </span>
            ) : (
              <Button type="button" variant="outline" size="sm" disabled>
                Downgrade
              </Button>
            )}
          </div>
        </div>

        {/* Growth — featured */}
        <div className="relative flex flex-col rounded-lg border-2 border-indigo-500 bg-background p-4 pt-8 shadow-sm">
          <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Most popular
          </span>
          <h3 className="text-base font-semibold text-indigo-900 dark:text-indigo-100">
            Growth
          </h3>
          <p className="mt-1 text-sm font-medium text-indigo-800/90 dark:text-indigo-200/90">
            $79/month
          </p>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
            <li>• 10 users</li>
            <li>• Unlimited leads and policies</li>
            <li>• Everything in Starter</li>
            <li>• Live WhatsApp sending</li>
            <li>• Birthday and renewal automation</li>
            <li>• Quotation system</li>
            <li>• Analytics and reporting</li>
            <li>• Document storage 5GB</li>
          </ul>
          <div className="mt-4">
            {currentPlan === "growth" ? (
              <span className="inline-flex rounded-full bg-indigo-600/15 px-2.5 py-1 text-xs font-semibold text-indigo-800 dark:text-indigo-200">
                Current plan
              </span>
            ) : (
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={pending || !growthPriceId.trim()}
                onClick={() =>
                  startTransition(() => void upgrade(growthPriceId))
                }
              >
                Upgrade to Growth
              </Button>
            )}
          </div>
        </div>

        {/* Pro */}
        <div className="flex flex-col rounded-lg border border-border bg-background p-4">
          <h3 className="text-base font-semibold">Pro</h3>
          <p className="mt-1 text-sm text-muted-foreground">$199/month</p>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
            <li>• Unlimited users</li>
            <li>• Everything in Growth</li>
            <li>• WhatsApp broadcasts</li>
            <li>• AI content generation</li>
            <li>• Audit logs</li>
            <li>• API access</li>
          </ul>
          <div className="mt-4">
            {currentPlan === "pro" ? (
              <span className="inline-flex rounded-full bg-violet-600/15 px-2.5 py-1 text-xs font-semibold text-violet-800 dark:text-violet-200">
                Current plan
              </span>
            ) : (
              <Button
                type="button"
                variant="secondary"
                className={cn("w-full sm:w-auto")}
                disabled={pending || !proPriceId.trim()}
                onClick={() => startTransition(() => void upgrade(proPriceId))}
              >
                Upgrade to Pro
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
