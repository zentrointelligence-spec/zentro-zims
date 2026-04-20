import { AlertCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/zims/page-header";
import { getCustomers, ApiError, humanizeDetail } from "@/lib/api";
import { CustomerListSchema } from "@/lib/schemas";

import { CustomerCreateLauncher } from "./components/CustomerForm";
import { CustomersTable } from "./components/CustomersTable";

export const metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  page_size?: string;
  search?: string;
  create?: string;
}>;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = clampInt(sp.page, 1, 10_000, 1);
  const pageSize = clampInt(sp.page_size, 5, 100, 20);
  const search = sp.search?.trim() || undefined;
  const autoOpenCreate = sp.create === "1";

  let listRes: unknown;
  try {
    listRes = await getCustomers({
      page,
      page_size: pageSize,
      ...(search ? { search } : {}),
    });
  } catch (err) {
    return <PageError err={err} />;
  }

  const parsedList = CustomerListSchema.safeParse(listRes);
  if (!parsedList.success) {
    return (
      <PageError err={new Error("Unexpected response shape from customers API")} />
    );
  }

  const { items, total, pages } = parsedList.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        badge={total}
        description="Manage your client relationships"
        actions={
          <CustomerCreateLauncher
            key={autoOpenCreate ? "create-open" : "create-closed"}
            autoOpenCreate={autoOpenCreate}
          />
        }
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>All customers</CardTitle>
            <CardDescription>
              {total} total · page {page} of {Math.max(pages, 1)}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CustomersTable
            customers={items}
            page={page}
            pages={pages}
            total={total}
            pageSize={pageSize}
            currentSearch={search ?? ""}
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
        <CardTitle>Could not load customers</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{msg}</CardContent>
    </Card>
  );
}
