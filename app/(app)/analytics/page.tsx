import { AlertCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/zims/page-header";
import {
  ApiError,
  getAnalyticsMonthly,
  getAnalyticsSummary,
  humanizeDetail,
} from "@/lib/api";

import { AnalyticsClient } from "./components/AnalyticsClient";
import { ExportButton } from "./components/ExportButton";

export const metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

function AnalyticsFetchError({ err }: { err: unknown }) {
  const msg =
    err instanceof ApiError
      ? (humanizeDetail(err.detail) ?? err.message)
      : err instanceof Error
        ? err.message
        : "Unknown error";
  return (
    <Card className="border-destructive/40">
      <CardHeader className="flex flex-row items-center gap-3">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <CardTitle>Could not load analytics</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{msg}</CardContent>
    </Card>
  );
}

export default async function AnalyticsPage() {
  let load:
    | { ok: true; summary: Awaited<ReturnType<typeof getAnalyticsSummary>>; monthly: Awaited<ReturnType<typeof getAnalyticsMonthly>> }
    | { ok: false; err: unknown };

  try {
    const [summary, monthly] = await Promise.all([
      getAnalyticsSummary(),
      getAnalyticsMonthly(),
    ]);
    load = { ok: true, summary, monthly };
  } catch (err) {
    load = { ok: false, err };
  }

  if (!load.ok) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description="Understand your agency's performance at a glance"
        />
        <AnalyticsFetchError err={load.err} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Understand your agency's performance at a glance"
        actions={<ExportButton summary={load.summary} />}
      />
      <AnalyticsClient summary={load.summary} monthly={load.monthly} />
    </div>
  );
}
