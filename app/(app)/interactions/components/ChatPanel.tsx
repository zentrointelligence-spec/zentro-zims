"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type SVGProps } from "react";

import { EmptyState } from "@/components/zims/empty-state";
import { LoadingSpinner } from "@/components/zims/loading-spinner";
import { StatusChip } from "@/components/zims/status-chip";
import { getInteractions } from "@/lib/interactions-client";
import type { Interaction, Lead } from "@/lib/schemas";

import { ChatThread } from "./ChatThread";
import { MessageInput } from "./MessageInput";

function ChatBubbleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4l-4 4v-4Z" />
    </svg>
  );
}

export function ChatPanel({
  lead,
  prefilledMessage,
}: {
  lead: Lead | null;
  prefilledMessage?: string;
}) {
  const qc = useQueryClient();
  const [optimistic, setOptimistic] = useState<Interaction[]>([]);
  const leadId = lead?.id ?? 0;

  const q = useQuery({
    queryKey: ["interactions", leadId],
    queryFn: () => getInteractions(leadId, { page: 1, page_size: 100 }),
    enabled: Boolean(lead),
  });

  if (!lead) {
    return (
      <section className="flex min-h-[280px] flex-1 flex-col items-center justify-center md:min-h-0">
        <EmptyState
          icon={ChatBubbleIcon}
          title="Select a lead"
          description="Choose a lead from the list to view their conversation history"
          className="py-16"
        />
      </section>
    );
  }

  const serverItems = q.data?.items ?? [];
  const merged = [...serverItems, ...optimistic].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-3 py-3 backdrop-blur-md md:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-medium leading-tight">{lead.name}</h2>
          <StatusChip kind="lead" status={lead.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {lead.phone?.trim() ? lead.phone : "—"}
        </p>
      </header>

      <div className="relative min-h-0 flex-1">
        {q.isLoading ? (
          <LoadingSpinner className="min-h-[12rem]" />
        ) : q.isError ? (
          <p className="p-4 text-sm text-destructive">
            {(q.error as Error)?.message ?? "Could not load messages"}
          </p>
        ) : (
          <ChatThread interactions={merged} />
        )}
      </div>

      <MessageInput
        key={`${lead.id}-${prefilledMessage ?? ""}`}
        leadId={lead.id}
        initialText={prefilledMessage}
        onOptimisticAppend={(row) => setOptimistic((p) => [...p, row])}
        onOptimisticRemove={(id) =>
          setOptimistic((p) => p.filter((x) => x.id !== id))
        }
        onServerSuccess={() => {
          setOptimistic([]);
          void qc.invalidateQueries({ queryKey: ["interactions", lead.id] });
        }}
      />
    </section>
  );
}
