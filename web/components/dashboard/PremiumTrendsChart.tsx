"use client";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { fadeInUp } from "@/lib/motion-config";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface PremiumTrendsChartProps {
  data: { name: string; value: number }[];
  title?: string;
  loading?: boolean;
  className?: string;
}

function GlassTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className={cn(
        "rounded-lg border border-white/20 bg-white/80 px-3 py-2 shadow-lg backdrop-blur-md",
        "dark:border-white/10 dark:bg-black/60"
      )}
    >
      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
        {payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

export function PremiumTrendsChart({
  data,
  title = "Premium Trends",
  loading,
  className,
}: PremiumTrendsChartProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-xl border border-[#e2e8f0] dark:border-white/10 bg-white dark:bg-card p-5 shadow-card",
          className
        )}
      >
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-4 h-[200px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "rounded-xl border border-[#e2e8f0] dark:border-white/10 bg-white dark:bg-card p-5 shadow-card",
        className
      )}
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={fadeInUp.transition}
    >
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h2>
      <div className="mt-4 h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              className="text-slate-100 dark:text-white/10"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-slate-400 dark:text-slate-500"
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-slate-400 dark:text-slate-500"
              axisLine={false}
              tickLine={false}
              dx={-8}
              width={48}
            />
            <Tooltip content={<GlassTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#premiumGradient)"
              animationBegin={200}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
