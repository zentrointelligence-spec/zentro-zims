"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { reduced } from "@/lib/motion-config";

interface SuccessCheckmarkProps {
  size?: number;
  className?: string;
}

export function SuccessCheckmark({ size = 32, className }: SuccessCheckmarkProps) {
  const isReduced = reduced();
  const strokeWidth = size >= 32 ? 2.5 : 2;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block", className)}
      aria-hidden
    >
      {/* Green circle background */}
      <motion.circle
        cx="26"
        cy="26"
        r="24"
        fill="#16a34a"
        initial={isReduced ? { scale: 1 } : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 20,
          delay: isReduced ? 0 : 0.1,
        }}
      />
      {/* Checkmark stroke */}
      <motion.path
        d="M14 27 L22 35 L38 19"
        stroke="white"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={isReduced ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: isReduced ? 0 : 0.3,
          ease: "easeOut",
          delay: isReduced ? 0 : 0.25,
        }}
      />
    </motion.svg>
  );
}
