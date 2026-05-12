import { AlertCircle, Plus } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/zims/page-header";
import {
  api,
  getCustomers,
  getQuotes,
  ApiError,
  humanizeDetail,
} from "@/lib/api";
import {
  Lead,
  QuoteListSchema,
  QuotePartyOptionSchema,
  QuoteStatusSchema,
} from "@/lib/schemas";

import { QuotesTable } from "./components/QuotesTable";
import { QuoteFilters } from "./components/QuoteFilters";

export const metadata = { title: "Quotes" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  status?: string;
  create?: string;
}>;

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = clampInt(sp.page, 1, 10_000, 1);
  const pageSize = 20;
  const parsedStatus = QuoteStatusSchema.safeParse(sp.status);
  const status = parsedStatus.success ? parsedStatus.data : undefined;
  const autoOpenCreate = sp.create === "1";

  const [quotesRes, leadsRes, customersRes] = await Promise.allSettled([
    getQuotes({ page, page_size: pageSize, ...(status ? { status } : {}) }),
    api.leads.list({ page: 1, page_size: 100 }),
    getCustomers({ page: 1, page_size: 100 }),
  ]);

  if (quotesRes.status === "rejected") {
    return <PageError err={quotesRes.reason} />;
  }

  const parsedList = QuoteListSchema.safeParse(quotesRes.value);
  if (!parsedList.success) {
    return (
      <PageError err={new Error("Unexpected response shape from quotes API")} />
    );
  }

  const { items, total, pages } = parsedList.data;
  const pipelineValue = items.reduce((sum, q) => {
    if (q.status === "rejected") return sum;
    const n = Number(q.premium_quoted);
    return Number.isFinite(n) ? sum + n : sum;
  }, 0);

  const leadRows =
    leadsRes.status === "fulfilled" ? leadsRes.value.items : [];
  const parsedLeads = leadRows
    .map((row) => {
      const p = Lead.pick({ id: true, name: true }).safeParse(row);
      if (!p.success) return null;
      const opt = QuotePartyOptionSchema.safeParse({
        id: String(p.data.id),
        name: p.data.name,
      });
      return opt.success ? opt.data : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const customerRows =
    customersRes.status === "fulfilled" ? customersRes.value.items : [];
  const parsedCustomers = customerRows
    .map((row) => {
      const opt = QuotePartyOptionSchema.safeParse({
        id: String(row.id),
        name: row.name,
      });
      return opt.success ? opt.data : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        badge={total}
        description="Manage your sales quotes and proposals"
        actions={
          <Link
            href="/quotes?create=1"
            className={buttonVariants({ variant: "default" })}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New quote
          </Link>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <p className="text-xs font-medium text-slate-500">Pipeline value</p>
        <p className="mt-1 text-2xl font-extrabold text-slate-900">
          RM {pipelineValue.toLocaleString("en-MY", { maximumFractionDigits: 2 })}
        </p>
      </div>

      <QuoteFilters currentStatus={status ?? "all"} />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>All quotes</CardTitle>
            <CardDescription>
              {total} total · page {page} of {Math.max(pages, 1)}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <QuotesTable
            key={autoOpenCreate ? "quotes-create" : "quotes-list"}
            quotes={items}
            page={page}
            pages={pages}
            total={total}
            pageSize={pageSize}
            leads={parsedLeads}
            customers={parsedCustomers}
            autoOpenCreate={autoOpenCreate}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function clampInt(
  v: string | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.floor(n), min), max);
}

function PageError({ err }: { err: unknown }) {
  const msg =
    err instanceof ApiError
      ? humanizeDetail(err.detail) ?? err.message
      : (err as Error)?.message ?? "Unknown error";
  return (
    <Card className="border-destructive/40">
      <CardHeader className="flex flex-row items-center gap-3">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <CardTitle>Could not load quotes</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{msg}</CardContent>
    </Card>
  );
}
