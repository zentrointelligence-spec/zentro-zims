import { AlertCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBroadcasts, ApiError, humanizeDetail } from "@/lib/api";
import { BroadcastStatusSchema, type BroadcastStatus } from "@/lib/schemas";

import { BroadcastFilters } from "./components/BroadcastFilters";
import { BroadcastForm } from "./components/BroadcastForm";
import { BroadcastsTable } from "./components/BroadcastsTable";

export const metadata = { title: "Broadcasts" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  status?: string;
  create?: string;
}>;

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
      ? (humanizeDetail(err.detail) ?? err.message)
      : (err as Error)?.message ?? "Unknown error";
  return (
    <Card className="border-destructive/40">
      <CardHeader className="flex flex-row items-center gap-3">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <CardTitle>Could not load broadcasts</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{msg}</CardContent>
    </Card>
  );
}

export default async function BroadcastsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = clampInt(sp.page, 1, 10_000, 1);
  const pageSize = 20;
  const statusParse = BroadcastStatusSchema.safeParse(sp.status);
  const statusFilter = statusParse.success ? statusParse.data : undefined;
  const autoOpenCreate = sp.create === "1";
  const currentFilter: "all" | BroadcastStatus = statusFilter ?? "all";

  let load:
    | {
        ok: true;
        items: Awaited<ReturnType<typeof getBroadcasts>>["items"];
        total: number;
        pages: number;
      }
    | { ok: false; err: unknown };

  try {
    const data = await getBroadcasts({
      page,
      page_size: pageSize,
      ...(statusFilter ? { status: statusFilter } : {}),
    });
    load = {
      ok: true,
      items: data.items,
      total: data.total,
      pages: data.pages,
    };
  } catch (err) {
    load = { ok: false, err };
  }

  if (!load.ok) {
    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Broadcasts</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Send WhatsApp campaigns to customer segments. Drafts can be
              previewed, sent once, and deleted while still in draft.
            </p>
          </div>
        </header>
        <PageError err={load.err} />
      </div>
    );
  }

  const { items, total, pages } = load;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Broadcasts</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Send WhatsApp campaigns to customer segments. Drafts can be
            previewed, sent once, and deleted while still in draft.
          </p>
        </div>
        <BroadcastForm
          key={autoOpenCreate ? "create-open" : "create-closed"}
          autoOpenCreate={autoOpenCreate}
        />
      </header>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>All broadcasts</CardTitle>
            <CardDescription>
              {total} total · page {page} of {Math.max(pages, 1)}
            </CardDescription>
          </div>
          <BroadcastFilters currentStatus={currentFilter} />
        </CardHeader>
        <CardContent className="space-y-4">
          <BroadcastsTable
            broadcasts={items}
            page={page}
            pages={pages}
            total={total}
            pageSize={pageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
