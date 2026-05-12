"use client";

import { Fragment } from "react";
import { Check, Play } from "lucide-react";

import { cn } from "@/lib/utils";

type StepState = "done" | "active" | "pending";

const STEPS: {
  title: string;
  subtitle: string;
  state: StepState;
  stepNum: number;
}[] = [
  { title: "Policy created", subtitle: "Trigger", state: "done", stepNum: 1 },
  { title: "30-day check", subtitle: "Daily sweep", state: "done", stepNum: 2 },
  { title: "WhatsApp sent", subtitle: "AI-generated", state: "active", stepNum: 3 },
  { title: "Task created", subtitle: "Agent follow-up", state: "pending", stepNum: 4 },
  { title: "Policy renewed", subtitle: "Revenue secured", state: "pending", stepNum: 5 },
];

function StepNode({
  title,
  subtitle,
  state,
  stepNum,
}: {
  title: string;
  subtitle: string;
  state: StepState;
  stepNum: number;
}) {
  return (
    <div
      className={cn(
        "min-w-[110px] flex-1 rounded-xl border px-2.5 py-3 text-center",
        state === "done" && "border-green-200 bg-green-50",
        state === "active" &&
          "border-brand-300 bg-brand-50 shadow-[0_0_0_1px_rgba(99,102,241,0.25)] animate-pulse",
        state === "pending" && "border-slate-200 bg-white",
      )}
    >
      <div className="flex justify-center">
        {state === "done" ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white">
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </div>
        ) : state === "active" ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white">
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
          </div>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
            {stepNum}
          </div>
        )}
      </div>
      <p className="mt-2 text-[11px] font-semibold leading-tight text-slate-900">{title}</p>
      <p className="mt-0.5 text-[10px] text-slate-400">{subtitle}</p>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex h-auto w-6 shrink-0 items-center self-center px-0.5">
      <div className="flex h-px min-w-[12px] flex-1 items-center bg-slate-200" />
      <div
        className="h-0 w-0 shrink-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-slate-300"
        aria-hidden
      />
    </div>
  );
}

export function WorkflowStrip() {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Automation workflow</h2>
          <p className="mt-1 text-[11px] text-slate-400">
            Powered by APScheduler · runs daily at 02:00 UTC
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Running
        </span>
      </div>

      <div className="mt-5 flex min-w-0 items-stretch overflow-x-auto pb-1 pt-1">
        <div className="flex min-w-max flex-1 items-stretch">
          {STEPS.map((step, i) => (
            <Fragment key={step.title}>
              <StepNode {...step} />
              {i < STEPS.length - 1 ? <Connector /> : null}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
