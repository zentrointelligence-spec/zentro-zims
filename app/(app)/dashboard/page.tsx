import { cache, Suspense } from "react";
import { AlertCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/zims/loading-spinner";
import { PageHeader } from "@/components/zims/page-header";
import { apiFetch, ApiError, humanizeDetail } from "@/lib/api";
import {
  parseDashboardListBundle,
  type DashboardListBundle,
} from "@/lib/schemas";

import { KpiCards } from "./components/KpiCards";
import { RecentLeads } from "./components/RecentLeads";
import { RecentTasks } from "./components/RecentTasks";
import { UpcomingRenewals } from "./components/UpcomingRenewals";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function DashboardFetchError({ err }: { err: unknown }) {
  const msg =
    err instanceof ApiError
      ? humanizeDetail(err.detail) ?? err.message
      : err instanceof Error
        ? err.message
        : "Unknown error";
  return (
    <Card className="border-destructive/40">
      <CardHeader className="flex flex-row items-center gap-3">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <CardTitle>Could not load dashboard</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{msg}</CardContent>
    </Card>
  );
}

type DashboardLoadResult =
  | { ok: true; data: DashboardListBundle }
  | { ok: false; err: unknown };

const loadDashboard = cache(async (): Promise<DashboardLoadResult> => {
  try {
    const [
      leadsRecent,
      customersCount,
      policiesTotal,
      policiesActive,
      policiesRenewalDue,
      tasksPending,
    ] = await Promise.all([
      apiFetch<unknown>("/leads", { query: { page: 1, page_size: 5 } }),
      apiFetch<unknown>("/customers", { query: { page: 1, page_size: 1 } }),
      apiFetch<unknown>("/policies", { query: { page: 1, page_size: 1 } }),
      apiFetch<unknown>("/policies", {
        query: { page: 1, page_size: 1, status: "active" },
      }),
      apiFetch<unknown>("/policies", {
        query: { page: 1, page_size: 5, status: "renewal_due" },
      }),
      apiFetch<unknown>("/tasks", {
        query: { page: 1, page_size: 5, status: "pending" },
      }),
    ]);

    const data = parseDashboardListBundle({
      leadsRecent,
      customersCount,
      policiesTotal,
      policiesActive,
      policiesRenewalDue,
      tasksPending,
    });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, err };
  }
});

async function DashboardErrorRail() {
  const result = await loadDashboard();
  if (!result.ok) {
    return <DashboardFetchError err={result.err} />;
  }
  return null;
}

async function DashboardKpiSection() {
  const result = await loadDashboard();
  if (!result.ok) {
    return null;
  }
  const { data } = result;
  const metrics = {
    totalLeads: data.leadsRecent.total,
    totalCustomers: data.customersCount.total,
    totalPolicies: data.policiesTotal.total,
    activePolicies: data.policiesActive.total,
    renewalDue: data.policiesRenewalDue.total,
  };
  return <KpiCards metrics={metrics} />;
}

async function DashboardRecentLeadsSection() {
  const result = await loadDashboard();
  if (!result.ok) {
    return null;
  }
  return <RecentLeads leads={result.data.leadsRecent.items} />;
}

async function DashboardRenewalsSection() {
  const result = await loadDashboard();
  if (!result.ok) {
    return null;
  }
  return <UpcomingRenewals policies={result.data.policiesRenewalDue.items} />;
}

async function DashboardTasksSection() {
  const result = await loadDashboard();
  if (!result.ok) {
    return null;
  }
  return <RecentTasks tasks={result.data.tasksPending.items} />;
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Live KPIs, newest leads, renewal queue and open tasks for your agency."
      />

      <Suspense fallback={null}>
        <DashboardErrorRail />
      </Suspense>

      <Suspense fallback={<LoadingSpinner />}>
        <DashboardKpiSection />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardRecentLeadsSection />
          </Suspense>
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardRenewalsSection />
          </Suspense>
        </div>
        <Suspense fallback={<LoadingSpinner />}>
          <DashboardTasksSection />
        </Suspense>
      </div>
    </div>
  );
}
