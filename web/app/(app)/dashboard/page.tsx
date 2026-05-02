import Link from "next/link";
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
import { getSessionUser } from "@/lib/auth";
import { apiFetch, ApiError, humanizeDetail } from "@/lib/api";
import {
  parseDashboardListBundle,
  type DashboardListBundle,
  type Task,
} from "@/lib/schemas";

import { KpiCards } from "./components/KpiCards";
import { LeadFunnel } from "./components/LeadFunnel";
import { RecentLeads } from "./components/RecentLeads";
import { RecentTasks } from "./components/RecentTasks";
import { TodayTasks } from "./components/TodayTasks";
import { UpcomingRenewals } from "./components/UpcomingRenewals";
import { WorkflowStrip } from "./components/WorkflowStrip";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function isDueToday(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const ref = new Date();
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

function hasTodayTasks(tasks: Task[]): boolean {
  return tasks.some(
    (t) =>
      isDueToday(t.due_date) &&
      (t.status === "pending" || t.status === "in_progress"),
  );
}

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

async function DashboardGreetingHeader() {
  const user = await getSessionUser();
  const hour = new Date().getHours();
  const salutation =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const title = user?.name ? `${salutation}, ${user.name}` : salutation;
  return (
    <PageHeader
      title={title}
      description="Live KPIs, newest leads, renewal queue and open tasks for your agency."
    />
  );
}

function DashboardActivityPlaceholder() {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-card">
      <h2 className="text-sm font-semibold text-slate-900">Revenue & activity</h2>
      <p className="mt-2 text-[13px] text-slate-500">
        Monthly trends and revenue charts live on the analytics page.
      </p>
      <Link
        href="/analytics"
        className="mt-4 inline-flex text-xs font-semibold text-brand-500 transition-colors hover:text-brand-600"
      >
        View full analytics →
      </Link>
    </div>
  );
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

async function DashboardLeadFunnelSection() {
  const result = await loadDashboard();
  if (!result.ok) {
    return null;
  }
  return (
    <LeadFunnel
      leads={result.data.leadsRecent.items}
      totalLeads={result.data.leadsRecent.total}
    />
  );
}

async function DashboardTasksRowSection() {
  const result = await loadDashboard();
  if (!result.ok) {
    return null;
  }
  const tasks = result.data.tasksPending.items;
  const hasToday = hasTodayTasks(tasks);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {hasToday ? (
        <>
          <div className="lg:col-span-2">
            <TodayTasks tasks={tasks} />
          </div>
          <div className="lg:col-span-1">
            <RecentTasks tasks={tasks} />
          </div>
        </>
      ) : (
        <div className="lg:col-span-3">
          <RecentTasks tasks={tasks} />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <PageHeader
            title="Dashboard"
            description="Live KPIs, newest leads, renewal queue and open tasks for your agency."
          />
        }
      >
        <DashboardGreetingHeader />
      </Suspense>

      <Suspense fallback={null}>
        <DashboardErrorRail />
      </Suspense>

      <Suspense fallback={<LoadingSpinner />}>
        <DashboardKpiSection />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardActivityPlaceholder />
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardLeadFunnelSection />
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<LoadingSpinner />}>
          <DashboardRecentLeadsSection />
        </Suspense>
        <Suspense fallback={<LoadingSpinner />}>
          <DashboardRenewalsSection />
        </Suspense>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <DashboardTasksRowSection />
      </Suspense>

      <WorkflowStrip />
    </div>
  );
}