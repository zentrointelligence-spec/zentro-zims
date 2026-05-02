"use client";

import "../broadcast-pulse.css";

import { cn } from "@/lib/utils";
import type { BroadcastStatus } from "@/lib/schemas";

const LABELS: Record<BroadcastStatus, string> = {
  draft: "Draft",
  sending: "Sending",
  sent: "Sent",
  failed: "Failed",
};

const TONE: Record<
  BroadcastStatus,
  "slate" | "indigo" | "emerald" | "rose"
> = {
  draft: "slate",
  sending: "indigo",
  sent: "emerald",
  failed: "rose",
};

const toneClass: Record<
  "slate" | "indigo" | "emerald" | "rose",
  string
> = {
  slate:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
  indigo:
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300",
  emerald:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  rose:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
};

export function BroadcastStatusChip({ status }: { status: BroadcastStatus }) {
  const tone = TONE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClass[tone],
      )}
    >
      {status === "sending" ? (
        <span
          className="broadcast-sending-dot"
          aria-hidden
          title="Sending in progress"
        />
      ) : null}
      <span>{LABELS[status]}</span>
    </span>
  );
}
