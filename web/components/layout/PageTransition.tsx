"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { reduced } from "@/lib/motion-config";

const variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

const transition = {
  duration: 0.15,
  ease: [0.4, 0, 0.2, 1] as const,
};

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isReduced = reduced();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={isReduced ? { opacity: 1 } : variants.initial}
        animate={isReduced ? { opacity: 1 } : variants.animate}
        exit={isReduced ? { opacity: 1 } : variants.exit}
        transition={transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
