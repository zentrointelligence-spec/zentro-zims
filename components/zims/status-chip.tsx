import { cn } from "@/lib/utils";

type Tone = {
  bg: string;
  text: string;
  dot: string;
  border: string;
};

const TONES = {
  lead: {
    new: { bg: "#ede9fe", text: "#3730a3", dot: "#6366f1", border: "#c7d2fe" },
    contacted: { bg: "#dbeafe", text: "#1e40af", dot: "#1d4ed8", border: "#bfdbfe" },
    qualified: { bg: "#fef3c7", text: "#92400e", dot: "#b45309", border: "#fde68a" },
    converted: { bg: "#dcfce7", text: "#166534", dot: "#16a34a", border: "#bbf7d0" },
    lost: { bg: "#f1f5f9", text: "#475569", dot: "#64748b", border: "#e2e8f0" },
  },
  policy: {
    active: { bg: "#dcfce7", text: "#166534", dot: "#16a34a", border: "#bbf7d0" },
    expired: { bg: "#fee2e2", text: "#991b1b", dot: "#dc2626", border: "#fecaca" },
    renewal_due: { bg: "#fef3c7", text: "#92400e", dot: "#b45309", border: "#fde68a" },
    cancelled: { bg: "#f1f5f9", text: "#475569", dot: "#64748b", border: "#e2e8f0" },
  },
  task: {
    pending: { bg: "#fef3c7", text: "#92400e", dot: "#b45309", border: "#fde68a" },
    in_progress: { bg: "#dbeafe", text: "#1e40af", dot: "#1d4ed8", border: "#bfdbfe" },
    done: { bg: "#dcfce7", text: "#166534", dot: "#16a34a", border: "#bbf7d0" },
    cancelled: { bg: "#f1f5f9", text: "#475569", dot: "#64748b", border: "#e2e8f0" },
  },
  quote: {
    draft: { bg: "#f1f5f9", text: "#475569", dot: "#64748b", border: "#e2e8f0" },
    sent: { bg: "#dbeafe", text: "#1e40af", dot: "#1d4ed8", border: "#bfdbfe" },
    accepted: { bg: "#dcfce7", text: "#166534", dot: "#16a34a", border: "#bbf7d0" },
    rejected: { bg: "#fee2e2", text: "#991b1b", dot: "#dc2626", border: "#fecaca" },
  },
} as const;

const LABELS: Record<string, string> = {
  renewal_due: "Renewal due",
  in_progress: "In progress",
};

const DEFAULT_TONE: Tone = {
  bg: "#f1f5f9",
  text: "#475569",
  dot: "#64748b",
  border: "#e2e8f0",
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
  const toneMap = TONES[kind] as Record<string, Tone>;
  const tone = toneMap[status] ?? DEFAULT_TONE;
  const label = LABELS[status] ?? status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-semibold capitalize",
        className,
      )}
      style={{
        backgroundColor: tone.bg,
        color: tone.text,
        border: `1px solid ${tone.border}66`,
      }}
    >
      <span
        className="h-[5px] w-[5px] rounded-full"
        style={{ backgroundColor: tone.dot }}
        aria-hidden
      />
      {label}
    </span>
  );
}
