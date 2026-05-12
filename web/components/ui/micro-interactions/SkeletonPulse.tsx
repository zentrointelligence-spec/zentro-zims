"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface SkeletonPulseProps {
  variant?: "text" | "circle" | "rect" | "avatar";
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function SkeletonPulse({
  variant = "text",
  width,
  height,
  className,
}: SkeletonPulseProps) {
  const variantClasses = {
    text: "h-4 w-full rounded-md",
    circle: "size-12 rounded-full",
    rect: "h-24 w-full rounded-xl",
    avatar: "size-10 rounded-full",
  };

  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = typeof width === "number" ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden bg-muted",
        variantClasses[variant],
        className
      )}
      style={style}
      animate={{ opacity: [1, 0.6, 1] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Shimmer gradient overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
        }}
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </motion.div>
  );
}
