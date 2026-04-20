import { cn } from "@/lib/utils";

export function ZentroLogo({
  className,
  variant = "dark",
}: {
  className?: string;
  /** `sidebar` follows `--sidebar-foreground` for light + dark rails. */
  variant?: "dark" | "light" | "sidebar";
}) {
  const mark =
    variant === "light"
      ? "from-indigo-400 to-violet-500"
      : "from-indigo-500 to-violet-600";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br text-sm font-bold text-white shadow-sm",
          mark,
        )}
      >
        Z
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "text-base font-semibold tracking-tight",
            variant === "light" && "text-white",
            variant === "dark" && "text-foreground",
            variant === "sidebar" && "text-sidebar-foreground",
          )}
        >
          Zentro
        </span>
        <span
          className={cn(
            "text-[10px] font-medium uppercase tracking-widest",
            variant === "light" && "text-slate-300",
            variant === "dark" && "text-muted-foreground",
            variant === "sidebar" && "text-sidebar-foreground/65",
          )}
        >
          ZIMS
        </span>
      </div>
    </div>
  );
}
