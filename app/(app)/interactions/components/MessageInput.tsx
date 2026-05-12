"use client";

import { Loader2, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toastMutationError } from "@/components/zims/app-toast";
import type { CreateInteractionPayload, Interaction } from "@/lib/schemas";
import { cn } from "@/lib/utils";

import { sendMessageAction } from "../actions";

type Channel = CreateInteractionPayload["channel"];

export function MessageInput({
  leadId,
  initialText,
  onOptimisticAppend,
  onOptimisticRemove,
  onServerSuccess,
}: {
  leadId: number;
  initialText?: string;
  onOptimisticAppend: (row: Interaction) => void;
  onOptimisticRemove: (id: string) => void;
  onServerSuccess: () => void;
}) {
  const [text, setText] = useState(() => initialText?.trim() ?? "");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [isPending, startTransition] = useTransition();

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !isPending;

  function buildOptimistic(tempId: string): Interaction {
    const now = new Date().toISOString();
    return {
      id: tempId,
      lead_id: String(leadId),
      message: trimmed,
      direction: "outgoing",
      channel,
      agency_id: "0",
      timestamp: now,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;

    const tempId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `temp-${crypto.randomUUID()}`
        : `temp-${Date.now()}`;
    const optimistic = buildOptimistic(tempId);
    onOptimisticAppend(optimistic);

    const fd = new FormData();
    fd.set("lead_id", String(leadId));
    fd.set("message", trimmed);
    fd.set("channel", channel);

    startTransition(() => {
      void (async () => {
        try {
          const res = await sendMessageAction(fd);
          if (!res.success) {
            onOptimisticRemove(tempId);
            toastMutationError(res.error);
            return;
          }
          setText("");
          onServerSuccess();
        } catch (err) {
          onOptimisticRemove(tempId);
          toastMutationError(
            err instanceof Error ? err.message : "Failed to send",
          );
        }
      })();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 z-10 border-t border-slate-200 bg-white p-3 md:px-4"
    >
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message…"
        className="w-full resize-none rounded-lg border-0 bg-transparent px-3 py-2 text-sm leading-[1.5] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isPending}
        aria-label="Message text"
      />
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap gap-1 rounded-[10px] border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setChannel("whatsapp")}
            className={cn(
              "rounded-[8px] px-[14px] py-[6px] text-[13px] font-medium transition-colors",
              channel === "whatsapp"
                ? "border border-brand-200 bg-white text-brand-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setChannel("note")}
            className={cn(
              "rounded-[8px] px-[14px] py-[6px] text-[13px] font-medium transition-colors",
              channel === "note"
                ? "border border-brand-200 bg-white text-brand-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            Note
          </button>
        </div>
        <Button
          type="submit"
          disabled={!canSend}
          className="shrink-0 bg-gradient-to-br from-brand-500 to-brand-600 text-white hover:brightness-110"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <>
              <Send className="size-4" aria-hidden />
              <span className="ml-1.5">Send</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
