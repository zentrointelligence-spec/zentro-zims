"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { fadeInUp } from "@/lib/motion-config";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type KPIColor = "blue" | "emerald" | "amber" | "violet" | "rose";

const COLOR_STYLES: Record<
  KPIColor,
  { iconBg: string; iconText: string; trendUp: string; trendDown: string; spark: string }
> = {
  blue: {
    iconBg: "bg-blue-50 dark:bg-blue-500/15",
    iconText: "text-blue-500 dark:text-blue-400",
    trendUp: "text-blue-600 dark:text-blue-400",
    trendDown: "text-rose-600 dark:text-rose-400",
    spark: "#3b82f6",
  },
  emerald: {
    iconBg: "bg-emerald-50 dark:bg-emerald-500/15",
    iconText: "text-emerald-500 dark:text-emerald-400",
    trendUp: "text-emerald-600 dark:text-emerald-400",
    trendDown: "text-rose-600 dark:text-rose-400",
    spark: "#10b981",
  },
  amber: {
    iconBg: "bg-amber-50 dark:bg-amber-500/15",
    iconText: "text-amber-500 dark:text-amber-400",
    trendUp: "text-amber-600 dark:text-amber-400",
    trendDown: "text-rose-600 dark:text-rose-400",
    spark: "#f59e0b",
  },
  violet: {
    iconBg: "bg-violet-50 dark:bg-violet-500/15",
    iconText: "text-violet-500 dark:text-violet-400",
    trendUp: "text-violet-600 dark:text-violet-400",
    trendDown: "text-rose-600 dark:text-rose-400",
    spark: "#8b5cf6",
  },
  rose: {
    iconBg: "bg-rose-50 dark:bg-rose-500/15",
    iconText: "text-rose-500 dark:text-rose-400",
    trendUp: "text-rose-600 dark:text-rose-400",
    trendDown: "text-rose-600 dark:text-rose-400",
    spark: "#f43f5e",
  },
};

function AnimatedNumber({
  value,
  delay = 0,
}: {
  value: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) =>
    Math.round(v).toLocaleString()
  );
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(motionValue, value, {
      duration: reducedMotion() ? 0 : 1.2,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v).toLocaleString()),
    });
    return controls.stop;
  }, [isInView, value, delay, motionValue]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  );
}

export interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color: KPIColor;
  sparklineData?: { label: string; value: number }[];
  loading?: boolean;
  delay?: number;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color,
  sparklineData,
  loading,
  delay = 0,
}: KPICardProps) {
  const styles = COLOR_STYLES[color];
  const isPositive = trend !== undefined ? trend >= 0 : undefined;

  if (loading) {
    return (
      <div className="rounded-xl border border-[#e2e8f0] dark:border-white/10 bg-white dark:bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-10 w-10 rounded-[10px]" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-8 w-24" />
        <Skeleton className="mt-1 h-4 w-16" />
        {sparklineData && <Skeleton className="mt-4 h-10 w-full" />}
      </div>
    );
  }

  return (
    <motion.div
      className="rounded-xl border border-[#e2e8f0] dark:border-white/10 bg-white dark:bg-card p-5 shadow-card"
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={{ ...fadeInUp.transition, delay }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]",
            styles.iconBg
          )}
        >
          <Icon className={cn("h-[18px] w-[18px]", styles.iconText)} />
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              isPositive
                ? `${styles.trendUp} bg-emerald-50 dark:bg-emerald-500/15`
                : `${styles.trendDown} bg-rose-50 dark:bg-rose-500/15`
            )}
          >
            {isPositive ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <p className="mt-4 text-[30px] font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
        <AnimatedNumber value={value} delay={delay + 0.1} />
      </p>

      <div className="mt-1 flex items-center gap-1.5">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {trendLabel && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            · {trendLabel}
          </span>
        )}
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4 h-10 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={styles.spark}
                strokeWidth={2}
                dot={false}
                animationDuration={1200}
                animationBegin={delay * 1000 + 200}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
