/** Shared formatting for analytics UI + CSV export. */

export function formatRM(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return `RM ${n.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function chartMonthLabel(ym: string): string {
  const parts = ym.split("-");
  if (parts.length < 2) return ym;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return ym;
  return new Date(y, m - 1, 1).toLocaleString("en-MY", { month: "short" });
}
