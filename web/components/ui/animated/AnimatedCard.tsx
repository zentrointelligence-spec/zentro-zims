"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { reduced, cardHover, cardPress, pulse } from "@/lib/motion-config"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export interface AnimatedCardProps extends React.ComponentProps<typeof Card> {
  isLoading?: boolean
  hasPulse?: boolean
}

export function AnimatedCard({
  children,
  className,
  isLoading,
  hasPulse,
  ...cardProps
}: AnimatedCardProps) {
  const isReduced = React.useMemo(() => reduced(), [])

  return (
    <motion.div
      className="relative"
      initial="rest"
      whileHover={isReduced ? undefined : "hover"}
      whileTap={isReduced ? undefined : "tap"}
      variants={{
        rest: cardHover.rest,
        hover: cardHover.hover,
        tap: cardPress.tap,
      }}
      transition={cardHover.transition}
    >
      <Card className={className} {...cardProps}>
        {children}
      </Card>
      {hasPulse && (
        <span className="absolute top-3 right-3 z-10 flex h-2.5 w-2.5">
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
            animate={isReduced ? undefined : pulse.animate}
            transition={pulse.transition}
          />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
      )}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col gap-3 rounded-xl bg-background/80 p-4 backdrop-blur-sm">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <div className="mt-auto flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      )}
    </motion.div>
  )
}
