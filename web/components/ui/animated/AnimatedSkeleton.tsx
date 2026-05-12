"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { shimmer } from "@/lib/motion-config"
import { cn } from "@/lib/utils"

export type AnimatedSkeletonVariant = "card" | "text" | "circle" | "table"

export interface AnimatedSkeletonProps extends React.ComponentProps<"div"> {
  variant?: AnimatedSkeletonVariant
  lines?: number
  rows?: number
}

export function AnimatedSkeleton({
  className,
  variant = "text",
  lines = 3,
  rows = 3,
  ...props
}: AnimatedSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy="true"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      {variant === "card" && (
        <div className="h-32 w-full rounded-xl bg-muted" />
      )}
      {variant === "text" && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-4 rounded-md bg-muted",
                i === lines - 1 ? "w-2/3" : "w-full"
              )}
            />
          ))}
        </div>
      )}
      {variant === "circle" && (
        <div className="size-12 rounded-full bg-muted" />
      )}
      {variant === "table" && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <div className="h-4 flex-1 rounded-md bg-muted" />
              <div className="h-4 flex-1 rounded-md bg-muted" />
              <div className="h-4 w-20 rounded-md bg-muted" />
            </div>
          ))}
        </div>
      )}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
        style={{ backgroundSize: "200% 100%" }}
        initial={shimmer.initial}
        animate={shimmer.animate}
        transition={shimmer.transition}
        aria-hidden="true"
      />
    </div>
  )
}
