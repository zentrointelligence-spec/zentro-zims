"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const colorMap = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
} as const;

const glowMap = {
  green: "bg-emerald-500/30",
  amber: "bg-amber-500/30",
  red: "bg-red-500/30",
  blue: "bg-blue-500/30",
} as const;

interface PulseIndicatorProps {
  color?: "green" | "amber" | "red" | "blue";
  label?: string;
  className?: string;
}

export function PulseIndicator({
  color = "green",
  label,
  className,
}: PulseIndicatorProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative flex size-2.5">
        <motion.span
          className={cn("absolute inline-flex size-full rounded-full", glowMap[color])}
          animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <span
          className={cn(
            "relative inline-flex size-2.5 rounded-full",
            colorMap[color]
          )}
        />
      </span>
      {label && (
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
