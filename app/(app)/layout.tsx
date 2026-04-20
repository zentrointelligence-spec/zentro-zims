import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/zims/app-shell";
import { GlobalSearchHost } from "@/components/zims/GlobalSearchHost";
import { ApiError, getBillingStatus } from "@/lib/api";
import { requireUser, clearSession } from "@/lib/auth";
import type { PlanTier } from "@/lib/schemas";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    // Session cookie was present (middleware let us through) but the backend
    // rejected the token — wipe the stale cookies and send them to login.
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      await clearSession();
      redirect("/login?reason=expired");
    }
    throw err;
  }

  let billingPlan: PlanTier | null = null;
  try {
    const st = await getBillingStatus();
    billingPlan = st.plan;
  } catch {
    billingPlan = null;
  }

  return (
    <>
      <AppShell user={user} billingPlan={billingPlan}>
        {children}
      </AppShell>
      <GlobalSearchHost />
    </>
  );
}
