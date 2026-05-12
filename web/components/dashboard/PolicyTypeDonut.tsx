"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { fadeInUp } from "@/lib/motion-config";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface PolicyTypeDonutProps {
  data: { name: string; value: number }[];
  title?: string;
  loading?: boolean;
  className?: string;
}

const COLORS = [
  "#6366f1", // brand-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#f43f5e", // rose-500
  "#8b5cf6", // violet-500
];



export function PolicyTypeDonut({
  data,
  title = "Policy Types",
  loading,
  className,
}: PolicyTypeDonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-xl border border-[#e2e8f0] dark:border-white/10 bg-white dark:bg-card p-5 shadow-card",
          className
        )}
      >
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-4 mx-auto h-[200px] w-[200px] rounded-full" />
        <div className="mt-4 flex justify-center gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
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

      <div className="relative mt-4 h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={activeIndex !== null ? 105 : 100}
              paddingAngle={3}
              dataKey="value"
              animationBegin={200}
              animationDuration={800}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
            {total.toLocaleString()}
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Total
          </span>
        </div>
      </div>

      {/* Interactive legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {data.map((entry, index) => {
          const color = COLORS[index % COLORS.length];
          const isActive = activeIndex === index;
          return (
            <button
              key={entry.name}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all",
                isActive
                  ? "bg-slate-50 dark:bg-white/10"
                  : "bg-transparent hover:bg-slate-50 dark:hover:bg-white/5"
              )}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-slate-600 dark:text-slate-300">
                {entry.name}
              </span>
              <span className="tabular-nums text-slate-400 dark:text-slate-500">
                {entry.value}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
