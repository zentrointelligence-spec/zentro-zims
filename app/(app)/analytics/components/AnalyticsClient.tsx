"use client";

import type { AnalyticsMonthlyRow, AnalyticsSummary } from "@/lib/schemas";

import { PageFade } from "@/components/zims/PageFade";

import { LeadStatusChart } from "./LeadStatusChart";
import { MonthlyTrendChart } from "./MonthlyTrendChart";
import { PolicyStatusChart } from "./PolicyStatusChart";
import { SummaryKpis } from "./SummaryKpis";

function isAnalyticsEmpty(summary: AnalyticsSummary) {
  return (
    summary.leads.total === 0 &&
    summary.customers.total === 0 &&
    summary.policies.total === 0
  );
}

export function AnalyticsClient({
  summary,
  monthly,
}: {
  summary: AnalyticsSummary;
  monthly: AnalyticsMonthlyRow[];
}) {
  const empty = isAnalyticsEmpty(summary);

  return (
    <PageFade>
      <div className="space-y-8">
        {empty ? (
          <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground">
            No data yet — your analytics will appear here once you start adding
            leads, customers, and policies.
          </p>
        ) : null}

        <SummaryKpis summary={summary} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-3">
            <LeadStatusChart leads={summary.leads} />
          </div>
          <div className="xl:col-span-3">
            <PolicyStatusChart policies={summary.policies} />
          </div>
          <div className="xl:col-span-6">
            <MonthlyTrendChart monthly={monthly} />
          </div>
        </div>
      </div>
    </PageFade>
  );
}
