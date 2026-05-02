"use client";

import { useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Button } from "@/components/ui/button";
import type { BillingStatus } from "@/lib/schemas";

import { openPortalAction, startCheckoutAction } from "../actions";
import { toastMutationError } from "@/components/zims/app-toast";

function planBadgeClass(plan: BillingStatus["plan"]): string {
  if (plan === "growth") {
    return "rounded-full bg-indigo-600/15 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:text-indigo-200";
  }
  if (plan === "pro") {
    return "rounded-full bg-violet-600/15 px-2.5 py-0.5 text-xs font-semibold text-violet-800 dark:text-violet-200";
  }
  return "rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground";
}

function billingBadgeClass(
  billing: BillingStatus["billing_status"],
): string {
  if (billing === "active") {
    return "rounded-full bg-emerald-600/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200";
  }
  if (billing === "past_due") {
    return "rounded-full bg-red-600/15 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:text-red-200";
  }
  if (billing === "cancelled") {
    return "rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground";
  }
  return "rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground";
}

function planLabel(plan: BillingStatus["plan"]): string {
  if (plan === "growth") return "Growth";
  if (plan === "pro") return "Pro";
  return "Starter";
}

function billingLabel(billing: BillingStatus["billing_status"]): string {
  if (billing === "active") return "Active";
  if (billing === "past_due") return "Payment due";
  if (billing === "cancelled") return "Cancelled";
  return "Free";
}

export function CurrentPlanCard({
  status,
  growthPriceId,
}: {
  status: BillingStatus;
  growthPriceId: string;
}) {
  const [pending, startTransition] = useTransition();

  const showGrowthUpgrade =
    status.billing_status === "free" || status.plan === "starter";

  async function runPortal() {
    try {
      const res = await openPortalAction();
      if (res && "error" in res) {
        toastMutationError(res.error);
      }
    } catch (err) {
      if (isRedirectError(err)) return;
      toastMutationError(
        err instanceof Error ? err.message : "Portal failed",
      );
    }
  }

  async function runCheckout(priceId: string) {
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
    <section className="rounded-xl border border-slate-200 border-l-4 border-l-brand-500 bg-white p-6 text-card-foreground shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className={planBadgeClass(status.plan)}>{planLabel(status.plan)}</span>
          <span className={billingBadgeClass(status.billing_status)}>
            {billingLabel(status.billing_status)}
          </span>
        </div>
        {status.stripe_customer_id ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-slate-300 bg-white"
            disabled={pending}
            onClick={() => startTransition(() => void runPortal())}
          >
            Manage billing
          </Button>
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        {status.billing_status === "past_due" ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
            <p className="font-medium">
              Your payment failed. Please update your payment method to avoid
              service interruption.
            </p>
            <Button
              type="button"
              className="mt-3"
              size="sm"
              disabled={pending}
              onClick={() => startTransition(() => void runPortal())}
            >
              Update payment method
            </Button>
          </div>
        ) : null}

        {status.billing_status === "cancelled" ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
            Your subscription has been cancelled. You are now on the Starter
            plan.
          </div>
        ) : null}

        {showGrowthUpgrade ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={pending || !growthPriceId.trim()}
              onClick={() =>
                startTransition(() => void runCheckout(growthPriceId))
              }
            >
              Upgrade to Growth
            </Button>
            {!growthPriceId.trim() ? (
              <span className="text-xs text-muted-foreground">
                Set NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID to enable checkout.
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
