"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AnalyticsSummary } from "@/lib/schemas";

import { formatRM } from "../lib/format";

function csvEscape(cell: string): string {
  if (/[",\n\r]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

function buildCsv(summary: AnalyticsSummary): string {
  const rows: [string, string][] = [
    ["Total Leads", String(summary.leads.total)],
    ["Conversion Rate (%)", summary.leads.conversion_rate.toFixed(2)],
    ["Total Customers", String(summary.customers.total)],
    ["Active Policies", String(summary.policies.by_status.active)],
    ["Total Premium Value", formatRM(summary.policies.total_premium_value)],
    ["Renewal Due This Month", String(summary.renewals_due_this_month)],
    ["Overdue Tasks", String(summary.tasks.overdue)],
    ["Expired This Month", String(summary.expired_this_month)],
  ];
  const header = "Metric,Value";
  const body = rows
    .map(([m, v]) => `${csvEscape(m)},${csvEscape(v)}`)
    .join("\r\n");
  return `${header}\r\n${body}\r\n`;
}

export function ExportButton({ summary }: { summary: AnalyticsSummary }) {
  function handleClick() {
    const csv = buildCsv(summary);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics-summary.csv";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="gap-1.5"
    >
      <Download className="size-4" />
      Export CSV
    </Button>
  );
}
