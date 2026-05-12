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
  if (c === "whatsapp") return "bg-green-50 text-green-700";
  if (c === "sms") return "bg-blue-50 text-blue-700";
  return "bg-slate-100 text-slate-500";
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
              <span className="rounded-full bg-slate-100 px-3 py-[3px] text-[11px] text-slate-500">
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
                    ? "rounded-[4px_16px_16px_16px] border border-slate-200 bg-white text-slate-800"
                    : "rounded-[16px_4px_16px_16px] bg-[#4f46e5] text-white",
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
                <span className="text-[10px] text-slate-400">{ts}</span>
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
