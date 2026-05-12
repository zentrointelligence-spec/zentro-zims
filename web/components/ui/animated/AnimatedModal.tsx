"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"
import { reduced, easing, backdropFade } from "@/lib/motion-config"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export interface AnimatedModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)")
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    setIsMobile(mql.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}

export function AnimatedModal({
  open = false,
  onOpenChange,
  children,
  className,
  showCloseButton = true,
}: AnimatedModalProps) {
  const [isPresent, setIsPresent] = React.useState(open)
  const isReduced = React.useMemo(() => reduced(), [])
  const isMobile = useIsMobile()

  React.useEffect(() => {
    if (open) setIsPresent(true)
  }, [open])

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (next) {
        setIsPresent(true)
        onOpenChange?.(true)
      } else {
        setIsPresent(false)
      }
    },
    [onOpenChange]
  )

  const contentInitial = isReduced
    ? undefined
    : { opacity: 0, scale: 0.96, y: isMobile ? 40 : 0 }
  const contentAnimate = isReduced
    ? undefined
    : { opacity: 1, scale: 1, y: 0 }
  const contentExit = isReduced
    ? undefined
    : { opacity: 0, scale: 0.96, y: isMobile ? 40 : 0 }

  return (
    <Dialog open={open || isPresent} onOpenChange={handleOpenChange}>
      <AnimatePresence
        onExitComplete={() => {
          if (!isPresent) {
            onOpenChange?.(false)
          }
        }}
      >
        {isPresent && (
          <DialogPrimitive.Portal>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-50 bg-black/40 supports-backdrop-filter:backdrop-blur-xs"
              initial={backdropFade.initial}
              animate={backdropFade.animate}
              exit={backdropFade.exit}
              transition={backdropFade.transition}
            >
              <DialogPrimitive.Backdrop className="absolute inset-0" />
            </motion.div>
            <DialogPrimitive.Popup
              key="popup"
              className={cn(
                "fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-1rem)] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-popover p-6 text-sm text-popover-foreground ring-1 ring-foreground/10 shadow-lg outline-none sm:max-w-lg sm:p-6",
                className
              )}
            >
              <motion.div
                className="grid gap-4"
                initial={contentInitial}
                animate={contentAnimate}
                exit={contentExit}
                transition={{ duration: 0.25, ease: easing.premium }}
              >
                {children}
                {showCloseButton && (
                  <DialogPrimitive.Close
                    data-slot="dialog-close"
                    render={
                      <Button
                        variant="ghost"
                        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                        size="icon-sm"
                      />
                    }
                  >
                    <XIcon />
                    <span className="sr-only">Close</span>
                  </DialogPrimitive.Close>
                )}
              </motion.div>
            </DialogPrimitive.Popup>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </Dialog>
  )
}

export {
  DialogTrigger as AnimatedModalTrigger,
  DialogClose as AnimatedModalClose,
  DialogHeader as AnimatedModalHeader,
  DialogFooter as AnimatedModalFooter,
  DialogTitle as AnimatedModalTitle,
  DialogDescription as AnimatedModalDescription,
}
