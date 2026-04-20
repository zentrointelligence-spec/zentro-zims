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
import { getAgencySettings, ApiError, humanizeDetail } from "@/lib/api";
import {
  AgencySettingsSchema,
  ZentroUserSessionSchema,
  type AgencySettings,
  type ZentroUserSession,
} from "@/lib/schemas";

import { SettingsClient } from "./components/SettingsClient";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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
    res = await getAgencySettings();
  } catch (err) {
    return <PageError err={err} />;
  }

  const parsed = AgencySettingsSchema.safeParse(res);
  if (!parsed.success) {
    return (
      <PageError
        err={new Error("Unexpected response shape from agency settings API")}
      />
    );
  }

  const settings: AgencySettings = parsed.data;

  return <SettingsClient settings={settings} />;
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
        <CardTitle>Could not load settings</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{msg}</CardContent>
    </Card>
  );
}
