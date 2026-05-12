"use client"

import * as React from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { cn } from "@/lib/utils"

export interface AnimatedNumberProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

export function AnimatedNumber({
  value,
  duration = 1.2,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: AnimatedNumberProps) {
  const count = useMotionValue(0)
  const [flash, setFlash] = React.useState<"increase" | "decrease" | null>(null)
  const prevRef = React.useRef(value)

  const formatted = useTransform(count, (latest) => {
    const factor = 10 ** decimals
    const rounded = Math.round(latest * factor) / factor
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(rounded)
  })

  const [displayText, setDisplayText] = React.useState(() => formatted.get())

  React.useEffect(() => {
    const unsubscribe = formatted.on("change", setDisplayText)
    return unsubscribe
  }, [formatted])

  React.useEffect(() => {
    if (value > prevRef.current) setFlash("increase")
    else if (value < prevRef.current) setFlash("decrease")
    else setFlash(null)
    prevRef.current = value

    const controls = animate(count, value, {
      duration,
      ease: "easeOut",
    })

    const timer = setTimeout(() => setFlash(null), 800)

    return () => {
      controls.stop()
      clearTimeout(timer)
    }
  }, [value, duration, count])

  return (
    <motion.span
      className={cn("font-mono tabular-nums tracking-tight", className)}
      animate={{
        color:
          flash === "increase"
            ? "#16a34a"
            : flash === "decrease"
            ? "#dc2626"
            : "currentColor",
      }}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      {displayText}
      {suffix}
    </motion.span>
  )
}
