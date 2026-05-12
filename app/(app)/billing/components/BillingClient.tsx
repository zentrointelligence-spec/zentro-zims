"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/zims/page-header";
import type { BillingStatus, PlanTier } from "@/lib/schemas";

function planDisplayName(plan: PlanTier): string {
  switch (plan) {
    case "starter":
      return "Starter";
    case "growth":
      return "Growth";
    case "pro":
      return "Pro";
    default:
      return plan;
  }
}

import { CurrentPlanCard } from "./CurrentPlanCard";
import { PlanTiersCard } from "./PlanTiersCard";
import { PlanUsageCard } from "./PlanUsageCard";

export function BillingClient({
  status,
  flash,
  growthPriceId,
  proPriceId,
}: {
  status: BillingStatus;
  flash: "success" | "cancelled" | null;
  growthPriceId: string;
  proPriceId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!flash || typeof window === "undefined") return;
    const mark = `zentro:billing-flash:${flash}:${window.location.href}`;
    if (sessionStorage.getItem(mark)) return;
    sessionStorage.setItem(mark, "1");
    if (flash === "success") {
      toast.success(
        `Subscription activated — welcome to ${planDisplayName(status.plan)}!`,
      );
    } else if (flash === "cancelled") {
      toast("Checkout cancelled");
    }
    router.replace("/billing", { scroll: false });
  }, [flash, router, status.plan]);

  return (
    <div className="mx-auto w-full max-w-[800px] space-y-6">
      <PageHeader
        title="Billing"
        description="Manage your subscription and plan limits"
      />
      <CurrentPlanCard status={status} growthPriceId={growthPriceId} />
      <PlanUsageCard limits={status.limits} usage={status.usage} />
      <PlanTiersCard
        currentPlan={status.plan}
        growthPriceId={growthPriceId}
        proPriceId={proPriceId}
      />
    </div>
  );
}
