import { AlertCircle, FileText, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/zims/empty-state";
import { PageFade } from "@/components/zims/PageFade";
import { PageHeader } from "@/components/zims/page-header";
import { StatusChip } from "@/components/zims/status-chip";
import { api, ApiError, humanizeDetail } from "@/lib/api";
import { PolicyStatus } from "@/lib/schemas";
import { daysUntil, formatCurrency, formatDate } from "@/lib/utils";

import { CreatePolicyDialog } from "./_components/create-policy-dialog";
import { PolicyFilters } from "./_components/filters";
import { ImportDialog } from "./_components/import-dialog";
import { Pagination } from "./_components/pagination";
import { PolicyRowActions } from "./_components/row-actions";
import { RunRenewalsButton } from "./_components/run-renewals-button";

export const metadata = { title: "Policies" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  page_size?: string;
  status?: string;
  create?: string;
}>;

export default async function PoliciesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = clampInt(sp.page, 1, 10_000, 1);
  const pageSize = clampInt(sp.page_size, 5, 100, 25);
  const parsedStatus = PolicyStatus.safeParse(sp.status);
  const status = parsedStatus.success ? parsedStatus.data : undefined;
  const autoOpenCreate = sp.create === "1";

  const [policiesRes, customersRes] = await Promise.allSettled([
    api.policies.list({ page, page_size: pageSize, status }),
    api.customers.list({ page: 1, page_size: 200 }),
  ]);

  if (policiesRes.status === "rejected") {
    return <PageError err={policiesRes.reason} />;
  }
  const { items, total, pages } = policiesRes.value;
  const customers =
    customersRes.status === "fulfilled" ? customersRes.value.items : [];

  const customerById = new Map(customers.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policies"
        badge={total}
        description="Track policies and automate renewals"
        actions={
          <>
            <RunRenewalsButton />
            <ImportDialog />
            <CreatePolicyDialog
              key={autoOpenCreate ? "create-open" : "create-closed"}
              customers={customers}
              autoOpenCreate={autoOpenCreate}
            />
          </>
        }
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>All policies</CardTitle>
            <CardDescription>
              {total} total · page {page} of {Math.max(pages, 1)}
            </CardDescription>
          </div>
          <PolicyFilters currentStatus={status ?? "all"} pageSize={pageSize} />
        </CardHeader>
        <CardContent className="space-y-4">
          <PageFade>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy #</TableHead>
                    <TableHead className="hidden md:table-cell">Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Start</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="hidden text-right md:table-cell">
                      Premium
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="p-0">
                        <EmptyState
                          title="No policies yet"
                          description="Issue your first policy to start tracking renewals"
                          icon={FileText}
                          action={
                            <Link
                              href="/policies?create=1"
                              className={buttonVariants()}
                            >
                              New policy
                            </Link>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                  items.map((p) => {
                    const customer = customerById.get(p.customer_id);
                    const dueIn = daysUntil(p.expiry_date);
                    return (
                      <TableRow
                        key={p.id}
                        className={
                          p.status === "expired"
                            ? "bg-red-50/60"
                            : (p.status === "renewal_due" || p.status === "active") &&
                                dueIn <= 7
                              ? "bg-amber-50/60"
                              : ""
                        }
                      >
                        <TableCell className="font-mono text-xs">
                          {p.policy_number}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {customer ? (
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {customer.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {customer.phone}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              #{p.customer_id}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden capitalize md:table-cell">
                          {p.policy_type}
                        </TableCell>
                        <TableCell className="hidden whitespace-nowrap text-sm md:table-cell">
                          {formatDate(p.start_date)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <div className="flex flex-col">
                            {dueIn < 0 || p.status === "expired" ? (
                              <span className="inline-flex w-fit rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                Expired
                              </span>
                            ) : dueIn <= 7 ? (
                              <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
                                <TriangleAlert className="h-3.5 w-3.5" />
                                {dueIn} days
                              </span>
                            ) : dueIn <= 30 ? (
                              <span className="text-sm font-medium text-amber-600">
                                {dueIn} days
                              </span>
                            ) : (
                              <span className="text-sm text-slate-600">
                                {formatDate(p.expiry_date)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-right font-mono md:table-cell">
                          {formatCurrency(p.premium)}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={p.status} kind="policy" />
                        </TableCell>
                        <TableCell className="text-right">
                          <PolicyRowActions policy={p} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                  )}
                </TableBody>
              </Table>
            </div>

            <Pagination
              page={page}
              pages={pages}
              total={total}
              pageSize={pageSize}
            />
          </PageFade>
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
        <CardTitle>Could not load policies</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{msg}</CardContent>
    </Card>
  );
}
