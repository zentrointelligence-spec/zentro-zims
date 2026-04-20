"use client";

import { useEffect, useMemo, useRef } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { MessageCircle, MessageSquare, Smartphone } from "lucide-react";

import type { Interaction } from "@/lib/schemas";
import { cn } from "@/lib/utils";

function channelIcon(channel: string) {
  const c = channel.toLowerCase();
  if (c === "whatsapp") return MessageCircle;
  if (c === "sms") return Smartphone;
  return MessageSquare;
}

function channelPillClass(channel: string) {
  const c = channel.toLowerCase();
  if (c === "whatsapp") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";
  if (c === "sms") return "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200";
  return "bg-muted text-muted-foreground";
}

function dayLabel(d: Date) {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "dd MMM yyyy");
}

type Row =
  | { type: "sep"; key: string; label: string }
  | { type: "msg"; key: string; item: Interaction };

export function ChatThread({ interactions }: { interactions: Interaction[] }) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const rows = useMemo(() => {
    const sorted = [...interactions].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const out: Row[] = [];
    let lastDay: string | null = null;
    for (const item of sorted) {
      const d = parseISO(item.timestamp);
      const key = format(d, "yyyy-MM-dd");
      if (key !== lastDay) {
        lastDay = key;
        out.push({ type: "sep", key: `sep-${key}`, label: dayLabel(d) });
      }
      out.push({ type: "msg", key: `m-${item.id}`, item });
    }
    return out;
  }, [interactions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rows]);

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 md:px-4">
      {rows.map((row) => {
        if (row.type === "sep") {
          return (
            <div
              key={row.key}
              className="flex justify-center py-2 text-[11px] font-medium text-muted-foreground"
            >
              <span className="rounded-full bg-muted/80 px-3 py-0.5">
                {row.label}
              </span>
            </div>
          );
        }
        const item = row.item;
        const incoming = item.direction === "incoming";
        const Icon = channelIcon(item.channel);
        const ts = format(parseISO(item.timestamp), "dd MMM, HH:mm");
        const optimistic = String(item.id).startsWith("temp-");
        return (
          <div
            key={row.key}
            className={cn("flex w-full", incoming ? "justify-start" : "justify-end")}
          >
            <div
              className={cn(
                "max-w-[70%] space-y-1",
                optimistic && "opacity-60",
              )}
            >
              <div
                className={cn(
                  "px-3 py-2 text-sm leading-[1.5] shadow-sm",
                  incoming
                    ? "rounded-[0_12px_12px_12px] bg-[#f3f4f6] text-[#111827] dark:bg-muted dark:text-foreground"
                    : "rounded-[12px_0_12px_12px] bg-[#4f46e5] text-white",
                )}
              >
                {item.message}
              </div>
              <div
                className={cn(
                  "flex flex-wrap items-center gap-2 px-0.5",
                  incoming ? "justify-start" : "justify-end",
                )}
              >
                <span className="text-[11px] text-muted-foreground">{ts}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                    channelPillClass(item.channel),
                  )}
                >
                  <Icon className="size-3 shrink-0" aria-hidden />
                  {item.channel}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
