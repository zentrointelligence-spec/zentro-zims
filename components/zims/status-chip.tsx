import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const chip = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
  {
    variants: {
      tone: {
        slate:
          "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
        indigo:
          "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900",
        emerald:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
        amber:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
        rose:
          "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
      },
    },
    defaultVariants: { tone: "slate" },
  },
);

const POLICY_TONES: Record<string, VariantProps<typeof chip>["tone"]> = {
  active: "emerald",
  expired: "rose",
  renewal_due: "amber",
  cancelled: "slate",
};

const LEAD_TONES: Record<string, VariantProps<typeof chip>["tone"]> = {
  new: "indigo",
  contacted: "amber",
  qualified: "indigo",
  converted: "emerald",
  lost: "rose",
};

const TASK_TONES: Record<string, VariantProps<typeof chip>["tone"]> = {
  pending: "amber",
  in_progress: "indigo",
  done: "emerald",
  cancelled: "slate",
};

const QUOTE_TONES: Record<string, VariantProps<typeof chip>["tone"]> = {
  draft: "slate",
  sent: "indigo",
  accepted: "emerald",
  rejected: "rose",
};

const LABELS: Record<string, string> = {
  renewal_due: "Renewal due",
  in_progress: "In progress",
};

export function StatusChip({
  status,
  kind = "policy",
  className,
}: {
  status: string;
  kind?: "policy" | "lead" | "task" | "quote";
  className?: string;
}) {
  const toneMap =
    kind === "lead"
      ? LEAD_TONES
      : kind === "task"
        ? TASK_TONES
        : kind === "quote"
          ? QUOTE_TONES
          : POLICY_TONES;
  const tone = toneMap[status] ?? "slate";
  const label = LABELS[status] ?? status.replace(/_/g, " ");
  return (
    <span className={cn(chip({ tone }), "capitalize", className)}>{label}</span>
  );
}
