import { Suspense } from "react";
import { AlertCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/zims/page-header";
import { apiFetch, ApiError, humanizeDetail } from "@/lib/api";
import { Lead as LeadSchema, Paginated } from "@/lib/schemas";

import { InteractionsClient } from "./components/InteractionsClient";

export const metadata = { title: "Interactions" };
export const dynamic = "force-dynamic";

export default async function InteractionsPage() {
  let listRes: unknown;
  try {
    listRes = await apiFetch<unknown>("/leads", {
      query: { page: 1, page_size: 50 },
    });
  } catch (err) {
    return <PageError err={err} />;
  }

  const parsedList = Paginated(LeadSchema).safeParse(listRes);
  if (!parsedList.success) {
    return (
      <PageError err={new Error("Unexpected response shape from leads API")} />
    );
  }

  const { items } = parsedList.data;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <PageHeader title="Interactions" />
      <Suspense fallback={null}>
        <InteractionsClient leads={items} />
      </Suspense>
    </div>
  );
}

function PageError({ err }: { err: unknown }) {
  const msg =
    err instanceof ApiError
      ? humanizeDetail(err.detail) ?? err.message
      : (err as Error)?.message ?? "Unknown error";
  return (
    <div className="space-y-4">
      <PageHeader title="Interactions" />
      <Card className="border-destructive/40">
        <CardHeader className="flex flex-row items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>Could not load leads</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{msg}</CardContent>
      </Card>
    </div>
  );
}
