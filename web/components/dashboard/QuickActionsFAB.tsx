"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, UserPlus, Users, FileText } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
}

const ACTIONS: QuickAction[] = [
  {
    label: "New Lead",
    href: "/leads/new",
    icon: UserPlus,
    color: "bg-brand-500 hover:bg-brand-600",
  },
  {
    label: "New Customer",
    href: "/customers/new",
    icon: Users,
    color: "bg-emerald-500 hover:bg-emerald-600",
  },
  {
    label: "New Policy",
    href: "/policies/new",
    icon: FileText,
    color: "bg-amber-500 hover:bg-amber-600",
  },
];

export interface QuickActionsFABProps {
  className?: string;
}

export function QuickActionsFAB({ className }: QuickActionsFABProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className={cn("fixed bottom-6 right-6 z-50", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute inset-x-0 bottom-16 flex flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {ACTIONS.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  transition={{
                    duration: 0.25,
                    delay: index * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-center gap-3"
                >
                  <span className="rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm dark:bg-black/70 dark:text-slate-200">
                    {action.label}
                  </span>
                  <Link
                    href={action.href}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg transition-colors",
                      action.color
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-xl transition-colors hover:bg-brand-600",
          open && "rotate-45 bg-slate-800 hover:bg-slate-700"
        )}
        whileTap={{ scale: 0.92 }}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        aria-expanded={open}
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Backdrop overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[-1] bg-black/20 backdrop-blur-[2px] dark:bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
