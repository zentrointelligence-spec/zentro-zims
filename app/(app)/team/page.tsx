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
import { getUsers, ApiError, humanizeDetail } from "@/lib/api";
import {
  UserListSchema,
  ZentroUserSessionSchema,
  type ZentroUserSession,
} from "@/lib/schemas";

import { TeamTable } from "./components/TeamTable";

export const metadata = { title: "Team" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  page_size?: string;
}>;

export default async function TeamPage({
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

  const currentUserId = session.id;

  const sp = await searchParams;
  const page = clampInt(sp.page, 1, 10_000, 1);
  const pageSize = clampInt(sp.page_size, 5, 100, 20);

  let listRes: unknown;
  try {
    listRes = await getUsers({ page, page_size: pageSize });
  } catch (err) {
    return <PageError err={err} />;
  }

  const parsedList = UserListSchema.safeParse(listRes);
  if (!parsedList.success) {
    return (
      <PageError err={new Error("Unexpected response shape from users API")} />
    );
  }

  const { items, total, pages } = parsedList.data;

  return (
    <TeamTable
      users={items}
      page={page}
      pages={pages}
      total={total}
      pageSize={pageSize}
      currentUserId={currentUserId}
    />
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
        <CardTitle>Could not load team</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{msg}</CardContent>
    </Card>
  );
}
