"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Loader2, Check } from "lucide-react"
import { reduced, buttonHover, buttonPress } from "@/lib/motion-config"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type ButtonProps = React.ComponentProps<typeof Button>

export interface AnimatedButtonProps extends ButtonProps {
  isLoading?: boolean
  isSuccess?: boolean
}

export function AnimatedButton({
  children,
  className,
  isLoading,
  isSuccess,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const isReduced = React.useMemo(() => reduced(), [])
  const [showSuccess, setShowSuccess] = React.useState(false)

  React.useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [isSuccess])

  return (
    <motion.div
      className="inline-flex"
      initial="rest"
      whileHover={isReduced ? undefined : "hover"}
      whileTap={isReduced ? undefined : "tap"}
      variants={{
        rest: buttonHover.rest,
        hover: buttonHover.hover,
        tap: buttonPress.tap,
      }}
      transition={buttonHover.transition}
    >
      <Button
        className={cn("relative overflow-hidden", className)}
        disabled={disabled || isLoading}
        {...props}
      >
        <span
          className={cn(
            "flex items-center gap-2 transition-opacity",
            (isLoading || showSuccess) && "opacity-0"
          )}
        >
          {children}
        </span>
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-4 animate-spin" />
          </span>
        )}
        {showSuccess && (
          <motion.span
            className="absolute inset-0 flex items-center justify-center gap-2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <Check className="size-4 text-green-600" />
          </motion.span>
        )}
        {showSuccess && (
          <motion.div
            className="pointer-events-none absolute inset-0 bg-green-500/20"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </Button>
    </motion.div>
  )
}
