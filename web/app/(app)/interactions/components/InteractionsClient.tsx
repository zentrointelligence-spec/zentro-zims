"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PageFade } from "@/components/zims/PageFade";
import type { Lead } from "@/lib/schemas";
import { cn } from "@/lib/utils";

import { ChatPanel } from "./ChatPanel";
import { LeadSelector } from "./LeadSelector";

export function InteractionsClient({ leads }: { leads: Lead[] }) {
  const searchParams = useSearchParams();
  const prefilledMessage = searchParams.get("message") ?? "";
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const selectedLead =
    selectedLeadId === null
      ? null
      : (leads.find((l) => l.id === selectedLeadId) ?? null);

  return (
    <PageFade>
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden md:h-[calc(100dvh-12rem)] md:min-h-[480px]">
      <div className="flex min-h-0 flex-1 flex-col border border-border bg-background md:flex-row md:rounded-lg">
        <div
          className={cn(
            "flex min-h-0 w-full shrink-0 flex-col overflow-hidden md:h-full md:w-[320px]",
            selectedLeadId !== null && "hidden md:flex",
          )}
        >
          <LeadSelector
            leads={leads}
            selectedLeadId={selectedLeadId}
            onSelect={setSelectedLeadId}
          />
        </div>
        <div className="hidden w-px shrink-0 bg-border md:block" aria-hidden />
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            selectedLeadId === null && "hidden md:flex",
          )}
        >
          {selectedLeadId !== null ? (
            <div className="flex shrink-0 items-center border-b border-border px-2 py-2 md:hidden">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-1 text-muted-foreground"
                onClick={() => setSelectedLeadId(null)}
              >
                ← Back
              </Button>
            </div>
          ) : null}
          <ChatPanel
            key={selectedLead?.id ?? "none"}
            lead={selectedLead}
            prefilledMessage={prefilledMessage}
          />
        </div>
      </div>
    </div>
    </PageFade>
  );
}
