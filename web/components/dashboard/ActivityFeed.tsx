"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";

import { staggerContainer } from "@/lib/motion-config";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  id: string;
  name: string;
  message: string;
  timestamp: string;
  avatarUrl?: string;
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  maxItems?: number;
  viewAllHref?: string;
  className?: string;
}

const AVATAR_STYLES = [
  "bg-brand-500",
  "bg-brand-600",
  "bg-teal-500",
  "bg-green-600",
  "bg-amber-500",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function avatarClass(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % AVATAR_STYLES.length;
  return AVATAR_STYLES[h] ?? AVATAR_STYLES[0]!;
}

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return ts;
  }
}

export function ActivityFeed({
  items,
  maxItems = 5,
  viewAllHref = "#",
  className,
}: ActivityFeedProps) {
  const visibleItems = items.slice(0, maxItems);

  return (
    <motion.div
      className={cn(
        "rounded-xl border border-[#e2e8f0] dark:border-white/10 bg-white dark:bg-card p-5 shadow-card",
        className
      )}
      initial={staggerContainer.initial}
      animate={staggerContainer.animate}
    >
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        Activity Feed
      </h2>

      {visibleItems.length === 0 ? (
        <motion.div
          className="mt-6 flex flex-col items-center justify-center py-8"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5">
            <Inbox className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            No recent activity
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Check back later for updates.
          </p>
        </motion.div>
      ) : (
        <ul className="mt-4 space-y-0">
          {visibleItems.map((item, index) => {
            const isLast = index === visibleItems.length - 1;
            return (
              <motion.li
                key={item.id}
                className="relative flex gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Dotted connector line */}
                {!isLast && (
                  <div className="absolute left-[17px] top-[38px] h-[calc(100%-14px)] border-l-2 border-dashed border-slate-200 dark:border-white/10" />
                )}

                <div
                  className={cn(
                    "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
                    item.avatarUrl
                      ? "overflow-hidden bg-transparent"
                      : avatarClass(item.name)
                  )}
                >
                  {item.avatarUrl ? (
                    <img
                      src={item.avatarUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(item.name)
                  )}
                </div>

                <div className="min-w-0 flex-1 pb-5">
                  <p className="text-[13px] text-slate-800 dark:text-slate-200">
                    <span className="font-semibold">{item.name}</span>{" "}
                    <span className="text-slate-500 dark:text-slate-400">
                      {item.message}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                    {formatTimestamp(item.timestamp)}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}

      {items.length > 0 && (
        <div className="mt-2 border-t border-slate-100 dark:border-white/5 pt-3">
          <Link
            href={viewAllHref}
            className="text-xs font-medium text-brand-500 transition-colors hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
          >
            View All →
          </Link>
        </div>
      )}
    </motion.div>
  );
}
