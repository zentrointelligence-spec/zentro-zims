import { AlertCircle } from "lucide-react";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCustomer, getCustomerPolicies, ApiError, humanizeDetail } from "@/lib/api";
import { Customer, Paginated, Policy } from "@/lib/schemas";

import { CustomerProfile } from "./components/CustomerProfile";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) {
    notFound();
  }

  let customerJson: unknown;
  let policiesJson: unknown;
  try {
    [customerJson, policiesJson] = await Promise.all([
      getCustomer(id),
      getCustomerPolicies(id, { page: 1, page_size: 20 }),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    return <PageError err={err} />;
  }

  const customerParsed = Customer.safeParse(customerJson);
  if (!customerParsed.success) {
    return (
      <PageError err={new Error("Unexpected response shape from customer API")} />
    );
  }

  const policiesParsed = Paginated(Policy).safeParse(policiesJson);
  if (!policiesParsed.success) {
    return (
      <PageError err={new Error("Unexpected response shape from policies API")} />
    );
  }

  const customer = customerParsed.data;
  const policies = policiesParsed.data.items;

  return (
    <div className="space-y-6">
      <CustomerProfile customer={customer} policies={policies} />
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) {
    return { title: "Customer" };
  }
  try {
    const c = await getCustomer(id);
    const parsed = Customer.safeParse(c);
    if (parsed.success) {
      return { title: `${parsed.data.name} · Customers` };
    }
  } catch {
    /* ignore */
  }
  return { title: "Customer" };
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
        <CardTitle>Could not load customer</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{msg}</CardContent>
    </Card>
  );
}
