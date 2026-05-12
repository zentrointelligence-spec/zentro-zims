"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { reduced, badgePop, pulse } from "@/lib/motion-config"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type BadgeProps = React.ComponentProps<typeof Badge>

export type StatusVariant =
  | "active"
  | "expired"
  | "renewal_due"
  | "cancelled"
  | "pending"
  | "paid"
  | "overdue"

const statusStyles: Record<StatusVariant, string> = {
  active:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
  expired:
    "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
  renewal_due:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-amber-200 dark:border-amber-800",
  cancelled:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-amber-200 dark:border-amber-800",
  paid:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
  overdue:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
}

export interface AnimatedBadgeProps extends BadgeProps {
  status?: StatusVariant
  isPulsing?: boolean
  count?: number
}

export function AnimatedBadge({
  children,
  className,
  status,
  isPulsing,
  count,
  variant,
  ...props
}: AnimatedBadgeProps) {
  const isReduced = React.useMemo(() => reduced(), [])

  return (
    <motion.span
      className="inline-flex items-center gap-1.5"
      initial={isReduced ? undefined : badgePop.initial}
      animate={isReduced ? undefined : badgePop.animate}
      exit={isReduced ? undefined : badgePop.exit}
      transition={{ ...badgePop.transition, type: "spring" as const }}
    >
      {isPulsing && (
        <span className="relative flex h-2 w-2">
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
            animate={isReduced ? undefined : pulse.animate}
            transition={pulse.transition}
          />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
      )}
      <Badge
        className={cn(status && statusStyles[status], className)}
        variant={variant}
        {...props}
      >
        {children}
        {typeof count === "number" && (
          <AnimatePresence mode="popLayout">
            <motion.span
              key={count}
              initial={isReduced ? undefined : { opacity: 0, y: -8 }}
              animate={isReduced ? undefined : { opacity: 1, y: 0 }}
              exit={isReduced ? undefined : { opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="ml-1 inline-block min-w-[1ch] text-center"
            >
              {count}
            </motion.span>
          </AnimatePresence>
        )}
      </Badge>
    </motion.span>
  )
}
