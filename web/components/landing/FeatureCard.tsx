"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { reduced, easing } from "@/lib/motion-config";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  delay?: number;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  delay = 0,
}: FeatureCardProps) {
  const isReduced = reduced();

  return (
    <motion.article
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 shadow-sm",
        "transition-shadow duration-200 hover:shadow-md"
      )}
      initial={isReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.35,
        ease: easing.premium,
        delay: isReduced ? 0 : delay,
      }}
      whileHover={isReduced ? undefined : { y: -4 }}
    >
      <div
        className={cn(
          "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg",
          color
        )}
      >
        <Icon className="h-6 w-6 text-white" aria-hidden />
      </div>
      <h3 className="text-lg font-bold tracking-[-0.02em] text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      <p className="mt-2 text-base leading-[1.7] text-gray-500 dark:text-gray-400">{description}</p>
    </motion.article>
  );
}
