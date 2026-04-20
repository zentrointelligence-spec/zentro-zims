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
import { api, ApiError, humanizeDetail } from "@/lib/api";
import { Paginated, Task, TaskStatus, TaskType } from "@/lib/schemas";

import { TaskFilters } from "./components/TaskFilters";
import { TasksTable } from "./components/TasksTable";

export const metadata = { title: "Tasks" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  page_size?: string;
  status?: string;
  type?: string;
  create?: string;
}>;

export default async function TasksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = clampInt(sp.page, 1, 10_000, 1);
  const pageSize = 20;
  const parsedStatus = TaskStatus.safeParse(sp.status);
  const status = parsedStatus.success ? parsedStatus.data : undefined;
  const parsedType = TaskType.safeParse(sp.type);
  const type = parsedType.success ? parsedType.data : undefined;
  const autoOpenCreate = sp.create === "1";

  let listRes: unknown;
  try {
    listRes = await api.tasks.list({
      page,
      page_size: pageSize,
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
    });
  } catch (err) {
    return <PageError err={err} />;
  }

  const parsedList = Paginated(Task).safeParse(listRes);
  if (!parsedList.success) {
    return (
      <PageError err={new Error("Unexpected response shape from tasks API")} />
    );
  }

  const { items, total, pages } = parsedList.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Follow-ups, renewal call-lists and everything your agents need to do today."
        actions={
          <Link
            href="/tasks?create=1"
            className={buttonVariants({ variant: "default" })}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New task
          </Link>
        }
      />

      <TaskFilters
        currentStatus={status ?? "all"}
        currentType={type ?? "all"}
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>All tasks</CardTitle>
            <CardDescription>
              {total} total · page {page} of {Math.max(pages, 1)}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <TasksTable
            key={
              (autoOpenCreate ? "c:" : "l:") +
              items.map((t) => `${t.id}:${t.status}`).join(",")
            }
            tasks={items}
            page={page}
            pages={pages}
            total={total}
            pageSize={pageSize}
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
        <CardTitle>Could not load tasks</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{msg}</CardContent>
    </Card>
  );
}
