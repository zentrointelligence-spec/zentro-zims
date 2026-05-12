"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Play, Zap } from "lucide-react"
import Link from "next/link"
import { LazyAnimatedDemo, LazyDemoModal } from "./LazySections"
import { WaitlistForm } from "./WaitlistForm"
import { trackCTA, trackDemo } from "@/lib/analytics"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
}

export function HeroSection() {
  const [demoOpen, setDemoOpen] = useState(false)

  return (
    <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40">
      {/* Background mesh — subtle, stays behind content */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-brand-500/[0.04] blur-[120px]" />
        <div className="absolute top-20 right-0 h-[400px] w-[500px] rounded-full bg-violet-500/[0.03] blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl text-center"
        >
          {/* Pill badge */}
          <motion.div variants={item}>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-300 ring-1 ring-brand-500/30">
              <Zap className="h-3.5 w-3.5" />
              Now with AI-powered renewal predictions
            </span>
          </motion.div>

          {/* Headline — word-by-word fade not needed; clean block is more confident */}
          <motion.h1
            variants={item}
            className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.1]"
          >
            Run your insurance agency{" "}
            <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">
              on autopilot
            </span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            variants={item}
            className="mt-6 text-lg leading-8 text-slate-300"
          >
            Zentro brings leads, customers, policies, and renewals into one
            intelligent workspace. Never miss a renewal. Never lose a lead.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={item}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/register"
              onClick={() => trackCTA("start_free", "hero_primary")}
              className="group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-700 hover:shadow-brand-500/30 active:scale-[0.98]"
            >
              Start free today
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button
              onClick={() => {
                trackDemo("play")
                setDemoOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-slate-200 transition-all hover:border-white/20 hover:bg-white/10 active:scale-[0.98]"
            >
              <Play className="h-4 w-4 text-slate-400" />
              Watch demo
            </button>
          </motion.div>

          {/* Waitlist Form */}
          <motion.div variants={item} className="mt-8">
            <WaitlistForm variant="hero" />
          </motion.div>

          {/* Trust micro-line */}
          <motion.p
            variants={item}
            className="mt-6 text-sm text-slate-400"
          >
            Trusted by 500+ agencies across SEA · No credit card required
          </motion.p>
        </motion.div>

        {/* Animated Product Demo */}
        <LazyAnimatedDemo />
      </div>

      <LazyDemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </section>
  )
}
