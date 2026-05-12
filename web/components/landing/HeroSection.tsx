"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  reduced,
  easing,
} from "@/lib/motion-config";

const headlineWords = ["Stop", "losing", "renewals.", "Start", "growing", "your", "agency."];

const floatTransition = {
  duration: 4,
  repeat: Infinity,
  repeatType: "reverse" as const,
  ease: "easeInOut" as const,
};

export function HeroSection() {
  const isReduced = reduced();

  return (
    <section className="relative flex min-h-[90vh] flex-col justify-center overflow-hidden border-b border-gray-200 px-4 py-16 sm:px-6">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <motion.p
            className={cn(
              "mb-6 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5",
              "text-sm font-medium text-indigo-700"
            )}
            initial={isReduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: easing.premium, delay: 0.05 }}
          >
            The all-in-one platform for modern insurance agencies
          </motion.p>

          {/* Animated headline */}
          <motion.h1
            className="text-4xl font-bold tracking-[-0.02em] text-gray-900 dark:text-gray-100 sm:text-5xl lg:text-[56px] lg:leading-[1.1]"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            aria-label="Stop losing renewals. Start growing your agency."
          >
            {headlineWords.map((word, i) => (
              <motion.span
                key={i}
                className="mr-[0.3em] inline-block"
                variants={staggerItem}
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-base leading-[1.7] text-gray-500 sm:text-lg"
            initial={isReduced ? { opacity: 1 } : fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={{ ...fadeInUp.transition, delay: 0.3 }}
          >
            Zentro replaces your spreadsheets, WhatsApp notes, and missed follow-ups
            with one intelligent platform built for insurance agencies.
          </motion.p>

          <motion.p
            className="mt-3 text-sm font-medium text-gray-600"
            initial={isReduced ? { opacity: 1 } : fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={{ ...fadeInUp.transition, delay: 0.4 }}
          >
            Manage leads, automate renewals, chat on WhatsApp, and close more deals —
            all in one place.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap"
            initial={isReduced ? { opacity: 1 } : fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={{ ...fadeInUp.transition, delay: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                className="h-11 min-w-[200px] bg-indigo-600 px-8 text-base text-white hover:bg-indigo-700"
                nativeButton={false}
                render={<Link href="/register" />}
              >
                Start free today
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                size="lg"
                className="h-11 min-w-[200px] border-gray-300 bg-white text-base text-gray-900 dark:text-gray-100 hover:bg-gray-50"
                nativeButton={false}
                render={<a href="#how-it-works" aria-label="Scroll to how it works" />}
              >
                See how it works
              </Button>
            </motion.div>
          </motion.div>

          <motion.p
            className="mt-6 text-center text-sm text-gray-500"
            initial={isReduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.6 }}
          >
            Trusted by insurance agencies across Southeast Asia · No credit card
            required
          </motion.p>
        </div>

        {/* Floating dashboard preview cards */}
        <div className="relative mx-auto mt-16 flex max-w-4xl flex-col items-center justify-center gap-4 sm:flex-row">
          <FloatCard delay={0.5} floatDelay={0} yOffset={-8} className="relative z-10">
            <div className="mb-3 h-3 w-20 rounded-full bg-indigo-100" />
            <div className="space-y-2">
              <div className="h-2.5 w-full rounded bg-gray-100" />
              <div className="h-2.5 w-3/4 rounded bg-gray-100" />
              <div className="h-2.5 w-5/6 rounded bg-gray-100" />
            </div>
          </FloatCard>

          <FloatCard delay={0.65} floatDelay={0.5} yOffset={-12} className="relative z-20 sm:-mt-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="size-8 rounded-full bg-emerald-100" />
              <div className="h-3 w-24 rounded-full bg-gray-100" />
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-full rounded bg-gray-100" />
              <div className="h-2.5 w-2/3 rounded bg-gray-100" />
            </div>
          </FloatCard>

          <FloatCard delay={0.8} floatDelay={1} yOffset={-6} className="relative z-10">
            <div className="mb-3 h-3 w-16 rounded-full bg-amber-100" />
            <div className="flex items-end gap-2">
              <div className="h-10 w-4 rounded bg-indigo-100" />
              <div className="h-14 w-4 rounded bg-indigo-200" />
              <div className="h-8 w-4 rounded bg-indigo-100" />
              <div className="h-12 w-4 rounded bg-indigo-200" />
            </div>
          </FloatCard>
        </div>
      </div>
    </section>
  );
}

function FloatCard({
  children,
  delay,
  floatDelay,
  yOffset,
  className,
}: {
  children: React.ReactNode;
  delay: number;
  floatDelay: number;
  yOffset: number;
  className?: string;
}) {
  const isReduced = reduced();

  return (
    <motion.div
      className={cn(
        "w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-lg sm:w-[280px]",
        className
      )}
      initial={isReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={
        isReduced
          ? { opacity: 1, y: 0 }
          : { opacity: 1, y: [0, yOffset, 0] }
      }
      transition={
        isReduced
          ? { duration: 0.4, ease: easing.premium, delay }
          : {
              opacity: { duration: 0.4, ease: easing.premium, delay },
              y: { ...floatTransition, delay: floatDelay },
            }
      }
    >
      {children}
    </motion.div>
  );
}
