import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const LABELS = [
  "Agency profile",
  "Import data",
  "WhatsApp setup",
  "Invite team",
] as const;

export function StepProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-1 sm:gap-2">
        {LABELS.map((label, i) => {
          const stepNum = i + 1;
          const done = currentStep > stepNum;
          const active = currentStep === stepNum;
          return (
            <div
              key={label}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center"
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-150 ease-in-out",
                  done &&
                    "border-indigo-600 bg-indigo-600 text-white shadow-sm",
                  active &&
                    !done &&
                    "border-indigo-600 bg-indigo-600 text-white shadow-sm",
                  !done &&
                    !active &&
                    "border-muted-foreground/30 bg-background text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={cn(
                  "hidden text-[11px] font-medium leading-tight transition-colors duration-150 ease-in-out sm:block",
                  active || done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between px-1 sm:hidden">
        {LABELS.map((label, i) => {
          const stepNum = i + 1;
          const active = currentStep === stepNum;
          return (
            <span
              key={label}
              className={cn(
                "max-w-[22%] truncate text-center text-[10px] font-medium transition-colors duration-150 ease-in-out",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
