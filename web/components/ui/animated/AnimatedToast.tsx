"use client"

import * as React from "react"
import { toast as sonnerToast, Toaster as Sonner, type ToasterProps } from "sonner"
import { motion } from "framer-motion"
import { X, CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastVariant = "success" | "error" | "info" | "warning"

const variantConfig: Record<
  ToastVariant,
  {
    icon: React.ReactNode
    border: string
    bg: string
    text: string
    progress: string
  }
> = {
  success: {
    icon: <CheckCircle2 className="size-5 shrink-0 text-green-600" />,
    border: "border-green-200 dark:border-green-800",
    bg: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-900 dark:text-green-100",
    progress: "bg-green-500",
  },
  error: {
    icon: <XCircle className="size-5 shrink-0 text-red-600" />,
    border: "border-red-200 dark:border-red-800",
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-900 dark:text-red-100",
    progress: "bg-red-500",
  },
  info: {
    icon: <Info className="size-5 shrink-0 text-blue-600" />,
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-900 dark:text-blue-100",
    progress: "bg-blue-500",
  },
  warning: {
    icon: <AlertTriangle className="size-5 shrink-0 text-amber-600" />,
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-900 dark:text-amber-100",
    progress: "bg-amber-500",
  },
}

interface ToastItemProps {
  id: string | number
  variant: ToastVariant
  title?: string
  description?: React.ReactNode
  duration?: number
}

function ToastItem({ id, variant, title, description, duration = 4000 }: ToastItemProps) {
  const cfg = variantConfig[variant]

  return (
    <div
      className={cn(
        "relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg",
        cfg.border,
        cfg.bg,
        cfg.text
      )}
    >
      {cfg.icon}
      <div className="flex-1">
        {title && <p className="text-sm font-medium">{title}</p>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <button
        onClick={() => sonnerToast.dismiss(id)}
        className="rounded-md p-1 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss toast"
      >
        <X className="size-4" />
      </button>
      {duration > 0 && (
        <motion.div
          className={cn("absolute bottom-0 left-0 h-0.5 w-full origin-left", cfg.progress)}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: "linear" }}
        />
      )}
    </div>
  )
}

export function useAnimatedToast() {
  return React.useMemo(
    () => ({
      success: (
        title: string,
        description?: React.ReactNode,
        options?: { duration?: number }
      ) =>
        sonnerToast.custom(
          (id) => (
            <ToastItem
              id={id}
              variant="success"
              title={title}
              description={description}
              duration={options?.duration ?? 4000}
            />
          ),
          { duration: options?.duration ?? 4000 }
        ),
      error: (
        title: string,
        description?: React.ReactNode,
        options?: { duration?: number }
      ) =>
        sonnerToast.custom(
          (id) => (
            <ToastItem
              id={id}
              variant="error"
              title={title}
              description={description}
              duration={options?.duration ?? 4000}
            />
          ),
          { duration: options?.duration ?? 4000 }
        ),
      info: (
        title: string,
        description?: React.ReactNode,
        options?: { duration?: number }
      ) =>
        sonnerToast.custom(
          (id) => (
            <ToastItem
              id={id}
              variant="info"
              title={title}
              description={description}
              duration={options?.duration ?? 4000}
            />
          ),
          { duration: options?.duration ?? 4000 }
        ),
      warning: (
        title: string,
        description?: React.ReactNode,
        options?: { duration?: number }
      ) =>
        sonnerToast.custom(
          (id) => (
            <ToastItem
              id={id}
              variant="warning"
              title={title}
              description={description}
              duration={options?.duration ?? 4000}
            />
          ),
          { duration: options?.duration ?? 4000 }
        ),
      custom: (content: React.ReactNode, options?: { duration?: number }) =>
        sonnerToast.custom(
          () => <div>{content}</div>,
          { duration: options?.duration ?? 4000 }
        ),
      dismiss: (id?: string | number) => sonnerToast.dismiss(id),
    }),
    []
  )
}

export function AnimatedToaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-right"
      visibleToasts={3}
      toastOptions={{
        classNames: {
          toast: "animated-toast",
        },
      }}
      {...props}
    />
  )
}
