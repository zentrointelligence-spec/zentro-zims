import { AlertCircle } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { USER_COOKIE } from "@/lib/auth";
import { getBillingStatus, ApiError, humanizeDetail } from "@/lib/api";
import {
  BillingStatusSchema,
  ZentroUserSessionSchema,
  type BillingStatus,
  type ZentroUserSession,
} from "@/lib/schemas";

import { BillingClient } from "./components/BillingClient";

export const metadata = { title: "Billing" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  success?: string | string[];
  cancelled?: string | string[];
}>;

function first(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const jar = await cookies();
  const raw = jar.get(USER_COOKIE)?.value;
  let session: ZentroUserSession | null = null;
  if (raw) {
    try {
      const parsed = ZentroUserSessionSchema.safeParse(JSON.parse(raw));
      if (parsed.success) {
        session = parsed.data;
      }
    } catch {
      session = null;
    }
  }

  if (!session || session.role !== "admin") {
    redirect("/dashboard");
  }

  let res: unknown;
  try {
    res = await getBillingStatus();
  } catch (err) {
    return <PageError err={err} />;
  }

  const parsed = BillingStatusSchema.safeParse(res);
  if (!parsed.success) {
    return (
      <PageError
        err={new Error("Unexpected response shape from billing status API")}
      />
    );
  }

  const status: BillingStatus = parsed.data;
  const sp = await searchParams;
  const flash =
    first(sp.success) === "true"
      ? ("success" as const)
      : first(sp.cancelled) === "true"
        ? ("cancelled" as const)
        : null;

  const growthPriceId =
    process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID?.trim() ?? "";
  const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID?.trim() ?? "";

  return (
    <BillingClient
      status={status}
      flash={flash}
      growthPriceId={growthPriceId}
      proPriceId={proPriceId}
    />
  );
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
        <CardTitle>Could not load billing</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{msg}</CardContent>
    </Card>
  );
}
