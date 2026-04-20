"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { QuoteForm } from "./QuoteForm";
import { QuoteRowActions } from "./QuoteRowActions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { DataTable } from "@/components/zims/data-table";
import { EmptyState } from "@/components/zims/empty-state";
import { PageFade } from "@/components/zims/PageFade";
import { StatusChip } from "@/components/zims/status-chip";
import type { Quote, QuotePartyOption } from "@/lib/schemas";
import { daysUntil, formatDate } from "@/lib/utils";
import { FileText, TriangleAlert } from "lucide-react";

function formatPremiumDisplay(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(n);
}

function validUntilCell(validUntil: string) {
  const due = daysUntil(validUntil);
  if (due < 0) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
        Expired
      </span>
    );
  }
  if (due <= 7) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
        <TriangleAlert className="h-3.5 w-3.5" />
        {due} days
      </span>
    );
  }
  if (due <= 30) {
    return <span className="text-sm font-medium text-amber-600">{due} days</span>;
  }
  return <span className="text-sm text-slate-600">{formatDate(validUntil)}</span>;
}

function leadOrCustomerName(
  quote: Quote,
  leadById: Map<string, string>,
  customerById: Map<string, string>,
): string {
  if (quote.lead_id) {
    return leadById.get(quote.lead_id) ?? "—";
  }
  if (quote.customer_id) {
    return customerById.get(quote.customer_id) ?? "—";
  }
  return "—";
}

export function QuotesTable({
  quotes,
  page,
  pages,
  total,
  pageSize,
  leads,
  customers,
  autoOpenCreate,
}: {
  quotes: Quote[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  leads: QuotePartyOption[];
  customers: QuotePartyOption[];
  autoOpenCreate?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [navPending, startNav] = useTransition();
  const [createOpen, setCreateOpen] = useState(() => Boolean(autoOpenCreate));

  const leadById = new Map(leads.map((l) => [l.id, l.name]));
  const customerById = new Map(customers.map((c) => [c.id, c.name]));

  useEffect(() => {
    if (!autoOpenCreate) return;
    router.replace("/quotes", { scroll: false });
  }, [autoOpenCreate, router]);

  useKeyboardShortcut("n", () => setCreateOpen(true), !createOpen);

  function go(next: number) {
    if (next < 1 || next > pages || navPending) return;
    startNav(() => {
      const p = new URLSearchParams(params);
      if (next === 1) p.delete("page");
      else p.set("page", String(next));
      router.push(`/quotes?${p.toString()}`);
    });
  }

  const start_ = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <PageFade>
      <div className="space-y-4">
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New quote</DialogTitle>
            <DialogDescription>
              Link the quote to exactly one lead or customer, then capture terms and
              premium.
            </DialogDescription>
          </DialogHeader>
          <QuoteForm
            mode="create"
            leads={leads}
            customers={customers}
            onSuccess={() => setCreateOpen(false)}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto rounded-md border">
        {quotes.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No quotes yet"
              description="Create a quote for a lead to start your sales process"
              icon={FileText}
              action={
                <Button type="button" onClick={() => setCreateOpen(true)}>
                  New quote
                </Button>
              }
            />
          </div>
        ) : (
          <DataTable
            columns={[
              "Lead / Customer",
              "Policy Type",
              "Insurer",
              "Premium",
              "Valid Until",
              "Status",
              "Actions",
            ]}
            columnHeaderClassName={[
              "",
              "hidden md:table-cell",
              "hidden md:table-cell",
              "hidden md:table-cell",
              "hidden md:table-cell",
              "",
              "",
            ]}
          >
            {quotes.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="px-0 py-2.5 align-middle text-sm font-medium">
                  {leadOrCustomerName(q, leadById, customerById)}
                </TableCell>
                <TableCell className="hidden px-0 py-2.5 align-middle text-sm capitalize md:table-cell">
                  {q.policy_type}
                </TableCell>
                <TableCell className="hidden px-0 py-2.5 align-middle text-sm md:table-cell">
                  {q.insurer || "—"}
                </TableCell>
                <TableCell className="hidden px-0 py-2.5 align-middle text-right font-mono text-sm tabular-nums md:table-cell">
                  {formatPremiumDisplay(q.premium_quoted)}
                </TableCell>
                <TableCell className="hidden px-0 py-2.5 align-middle md:table-cell">
                  {validUntilCell(q.valid_until)}
                </TableCell>
                <TableCell className="px-0 py-2.5 align-middle">
                  <StatusChip status={q.status} kind="quote" />
                </TableCell>
                <TableCell className="px-0 py-2.5 align-middle text-right">
                  <QuoteRowActions quote={q} leads={leads} customers={customers} />
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </div>

      {quotes.length > 0 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {total === 0
              ? "No results"
              : `Showing ${start_}–${end} of ${total}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || navPending}
              onClick={() => go(page - 1)}
            >
              Prev
            </Button>
            <span className="tabular-nums text-muted-foreground">
              Page {page} / {Math.max(pages, 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages || navPending}
              onClick={() => go(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
      </div>
    </PageFade>
  );
}
