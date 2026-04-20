import type { ComponentType, SVGProps } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ComingSoon({
  title,
  blurb,
  icon: Icon,
}: {
  title: string;
  blurb: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">{blurb}</p>
      </header>
      <Card className="border-dashed">
        <CardHeader className="flex flex-row items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-base">Arriving in Phase 2</CardTitle>
            <CardDescription>
              The FastAPI endpoints are already live — the UI is being polished
              for launch.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          In the meantime, use the REST API directly —
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
            /api/v1/...
          </code>
          — or check back soon.
        </CardContent>
      </Card>
    </div>
  );
}
